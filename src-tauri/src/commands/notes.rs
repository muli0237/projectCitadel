use std::fs;
use tauri::State;
use crate::app_state::AppState;
use crate::models::workspace::NoteRecord;
use crate::services::workspace_service::WorkspaceService;
use crate::utils::paths::PathResolver;

#[tauri::command]
pub async fn list_notes(state: State<'_, AppState>) -> Result<Vec<NoteRecord>, String> {
    let db_guard = state.database.lock().await;
    if let Some(ref conn) = *db_guard {
        WorkspaceService::list_notes(conn).map_err(|e| e.to_string())
    } else {
        Ok(vec![])
    }
}

#[tauri::command]
pub async fn read_note(note_id: String, state: State<'_, AppState>) -> Result<String, String> {
    let note_path = PathResolver::sanitize_subpath(&state.portable_root, &format!("notes/{}.md", note_id))
        .map_err(|e| e.to_string())?;

    if note_path.exists() {
        fs::read_to_string(&note_path).map_err(|e| e.to_string())
    } else {
        Err(format!("Note file '{}.md' not found", note_id))
    }
}

#[tauri::command]
pub async fn write_note(note: NoteRecord, state: State<'_, AppState>) -> Result<bool, String> {
    let db_guard = state.database.lock().await;
    if let Some(ref conn) = *db_guard {
        WorkspaceService::save_note(conn, &state.portable_root, &note)
            .map(|_| true)
            .map_err(|e| e.to_string())
    } else {
        Err("Database connection not available".into())
    }
}
