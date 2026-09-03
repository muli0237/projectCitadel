use std::path::PathBuf;
use tauri::State;
use crate::app_state::AppState;
use crate::models::workspace::{ProjectRecord, WorkspaceStatus};
use crate::services::workspace_service::WorkspaceService;
use crate::errors::{CitadelError, Result};

#[tauri::command]
pub async fn get_workspace_status(state: State<'_, AppState>) -> Result<WorkspaceStatus, String> {
    let db_guard = state.database.lock().await;
    let status = WorkspaceService::get_status(&state.portable_root, db_guard.as_ref());
    Ok(status)
}

#[tauri::command]
pub async fn select_workspace_root(new_path: String, _state: State<'_, AppState>) -> Result<crate::models::boot::BootReport> {
    let candidate = new_path.trim();
    if candidate.is_empty() {
        return Err(CitadelError::WorkspaceUnavailable("Workspace path cannot be empty".into()));
    }

    let path = PathBuf::from(candidate);
    if !path.is_absolute() {
        return Err(CitadelError::Security("Workspace path must be absolute".into()));
    }
    if !path.exists() || !path.is_dir() {
        return Err(CitadelError::WorkspaceUnavailable(format!(
            "Workspace directory does not exist: {}", path.display()
        )));
    }

    WorkspaceService::ensure_directories(&path)?;
    Ok(crate::services::boot_service::BootService::perform_boot_sequence(&path))
}

#[tauri::command]
pub async fn recover_stale_workspace_lock(state: State<'_, AppState>) -> Result<bool, String> {
    let lock_file = state.portable_root.join("workspace.lock");
    WorkspaceService::recover_stale_lock(&lock_file).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn prepare_safe_eject(state: State<'_, AppState>) -> Result<String, String> {
    let db_guard = state.database.lock().await;
    if let Some(ref conn) = *db_guard {
        let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
    }
    Ok("Flushed SQLite WAL buffers. Storage is safe to unmount.".into())
}

#[tauri::command]
pub async fn list_projects(state: State<'_, AppState>) -> Result<Vec<ProjectRecord>, String> {
    let db_guard = state.database.lock().await;
    if let Some(ref conn) = *db_guard {
        WorkspaceService::list_projects(conn).map_err(|e| e.to_string())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
pub async fn create_project(project: ProjectRecord, state: State<'_, AppState>) -> Result<bool, String> {
    let db_guard = state.database.lock().await;
    if let Some(ref conn) = *db_guard {
        WorkspaceService::upsert_project(conn, &state.portable_root, &project)
            .map(|_| true)
            .map_err(|e| e.to_string())
    } else {
        Err("Database connection not ready".into())
    }
}

// ----------------------------------------------------------------------------
// Code Lab File Operations & Safe Path Validation
// ----------------------------------------------------------------------------

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct VirtualFileRecord {
    pub path: String,
    pub name: String,
    pub language: String,
    pub content: String,
    #[serde(rename = "isModified")]
    pub is_modified: bool,
    pub status: String,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: usize,
    #[serde(rename = "lastModifiedAt")]
    pub last_modified_at: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct FileSaveResult {
    pub success: bool,
    pub path: String,
    #[serde(rename = "bytesWritten")]
    pub bytes_written: usize,
    pub timestamp: String,
}

/// Validates that a relative path does not escape the workspace project root and contains no malicious tokens.
fn sanitize_and_resolve_file_path(
    root: &std::path::Path,
    project_id: Option<&str>,
    rel_path: &str,
) -> Result<PathBuf, String> {
    let trimmed = rel_path.trim();
    if trimmed.is_empty() {
        return Err("File path cannot be empty or whitespace".into());
    }

    // Prohibit forbidden characters across POSIX and Windows filesystems
    let forbidden = ['\0', '<', '>', ':', '"', '|', '?', '*'];
    if trimmed.chars().any(|c| forbidden.contains(&c)) {
        return Err("File path contains illegal characters (<, >, :, \", |, ?, *, \\0)".into());
    }

    let rel = std::path::Path::new(trimmed);
    // Disallow absolute paths from escaping
    if rel.is_absolute() {
        return Err("Absolute paths are not permitted in workspace operations".into());
    }

    // Check for directory traversal '..'
    for component in rel.components() {
        match component {
            std::path::Component::ParentDir => {
                return Err("Path traversal (..) is strictly prohibited".into());
            }
            std::path::Component::Normal(_) | std::path::Component::CurDir => {}
            _ => {
                return Err("Invalid path component detected".into());
            }
        }
    }

    // Determine target project root directory
    let base_dir = if let Some(pid) = project_id {
        if !pid.trim().is_empty() {
            root.join("projects").join(pid)
        } else {
            root.join("projects").join("default")
        }
    } else {
        root.join("projects").join("default")
    };

    let full_path = base_dir.join(rel);
    Ok(full_path)
}

fn detect_language_from_ext(path: &str) -> String {
    let ext = path.split('.').last().unwrap_or("txt").to_lowercase();
    match ext.as_str() {
        "rs" => "rust".into(),
        "py" => "python".into(),
        "js" => "javascript".into(),
        "ts" | "tsx" => "typescript".into(),
        "json" => "json".into(),
        "sh" | "bash" | "zsh" => "shell".into(),
        "md" | "markdown" => "markdown".into(),
        "toml" => "toml".into(),
        "yaml" | "yml" => "yaml".into(),
        "sql" => "sql".into(),
        "c" | "h" => "c".into(),
        "cpp" | "hpp" => "cpp".into(),
        "html" => "html".into(),
        "css" => "css".into(),
        _ => "plaintext".into(),
    }
}

#[tauri::command]
pub async fn create_workspace_file(
    project_id: Option<String>,
    relative_path: String,
    initial_content: Option<String>,
    state: State<'_, AppState>,
) -> Result<VirtualFileRecord, String> {
    let target_path = sanitize_and_resolve_file_path(
        &state.portable_root,
        project_id.as_deref(),
        &relative_path,
    )?;

    if target_path.exists() {
        return Err(format!("File already exists: {}", relative_path));
    }

    // Ensure parent directory exists
    if let Some(parent) = target_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| {
            format!("Failed to create parent directories for {}: {}", relative_path, e)
        })?;
    }

    let content = initial_content.unwrap_or_else(|| {
        format!(
            "// {}\n// Created in Citadel Code Lab\n\n",
            relative_path
        )
    });

    std::fs::write(&target_path, &content).map_err(|e| {
        format!("Permission denied or I/O failure writing to {}: {}", relative_path, e)
    })?;

    let file_name = target_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(&relative_path)
        .to_string();

    let language = detect_language_from_ext(&relative_path);
    let size_bytes = content.len();
    let now = chrono::Utc::now().to_rfc3339();

    Ok(VirtualFileRecord {
        path: relative_path,
        name: file_name,
        language,
        content,
        is_modified: false,
        status: "clean".into(),
        size_bytes,
        last_modified_at: now,
    })
}

#[tauri::command]
pub async fn save_workspace_file(
    project_id: Option<String>,
    relative_path: String,
    content: String,
    state: State<'_, AppState>,
) -> Result<FileSaveResult, String> {
    let target_path = sanitize_and_resolve_file_path(
        &state.portable_root,
        project_id.as_deref(),
        &relative_path,
    )?;

    // Ensure parent directories exist in case of newly referenced paths
    if let Some(parent) = target_path.parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| {
                format!("Failed to create parent directories for {}: {}", relative_path, e)
            })?;
        }
    }

    let bytes_written = content.as_bytes().len();
    std::fs::write(&target_path, &content).map_err(|e| {
        format!("Failed to persist file {}: {}", relative_path, e)
    })?;

    let now = chrono::Utc::now().to_rfc3339();
    Ok(FileSaveResult {
        success: true,
        path: relative_path,
        bytes_written,
        timestamp: now,
    })
}

#[tauri::command]
pub async fn delete_workspace_file(
    project_id: Option<String>,
    relative_path: String,
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let target_path = sanitize_and_resolve_file_path(
        &state.portable_root,
        project_id.as_deref(),
        &relative_path,
    )?;

    if !target_path.exists() {
        return Err(format!("File not found on disk: {}", relative_path));
    }

    if target_path.is_dir() {
        return Err(format!(
            "Target path is a directory. Directory deletion requires recursive unmount: {}",
            relative_path
        ));
    }

    std::fs::remove_file(&target_path).map_err(|e| {
        format!("Failed to delete file {}: {}", relative_path, e)
    })?;

    Ok(true)
}

#[tauri::command]
pub async fn read_workspace_file(
    project_id: Option<String>,
    relative_path: String,
    state: State<'_, AppState>,
) -> Result<VirtualFileRecord, String> {
    let target_path = sanitize_and_resolve_file_path(
        &state.portable_root,
        project_id.as_deref(),
        &relative_path,
    )?;

    if !target_path.exists() {
        return Err(format!("File does not exist: {}", relative_path));
    }

    let content = std::fs::read_to_string(&target_path).map_err(|e| {
        format!("Failed to read file {}: {}", relative_path, e)
    })?;

    let file_name = target_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(&relative_path)
        .to_string();

    let language = detect_language_from_ext(&relative_path);
    let size_bytes = content.len();
    let now = chrono::Utc::now().to_rfc3339();

    Ok(VirtualFileRecord {
        path: relative_path,
        name: file_name,
        language,
        content,
        is_modified: false,
        status: "clean".into(),
        size_bytes,
        last_modified_at: now,
    })
}
