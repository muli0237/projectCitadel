use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceDirectories {
    pub projects: PathBuf,
    pub notes: PathBuf,
    pub datasets: PathBuf,
    pub tool_profiles: PathBuf,
    pub logs: PathBuf,
    pub backups: PathBuf,
    pub cache: PathBuf,
    pub config: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceStatus {
    pub root_path: String,
    pub exists: bool,
    pub is_writable: bool,
    pub is_removable_drive: bool,
    pub has_stale_lock: bool,
    pub total_space_bytes: u64,
    pub free_space_bytes: u64,
    pub project_count: usize,
    pub note_count: usize,
    pub database_integrity_ok: bool,
    pub last_checked_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRecord {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: String,
    pub path: String,
    pub repository_url: Option<String>,
    pub tags: Vec<String>,
    pub pinned: bool,
    pub archived: bool,
    pub preferred_shell: Option<String>,
    pub created_at: String,
    pub last_opened_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NoteRecord {
    pub id: String,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    pub project_id: Option<String>,
    pub template_type: Option<String>,
    pub pinned: bool,
    pub created_at: String,
    pub updated_at: String,
}
