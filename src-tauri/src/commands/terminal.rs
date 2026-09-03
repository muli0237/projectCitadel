use tauri::State;
use crate::app_state::AppState;

#[tauri::command]
pub async fn create_terminal_session(id: String, cols: u16, rows: u16, state: State<'_, AppState>) -> Result<bool, String> {
    let registry = state.process_registry.lock().await;
    registry.create_terminal_session(&id, cols, rows).map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_terminal_input(id: String, input: String, state: State<'_, AppState>) -> Result<bool, String> {
    let registry = state.process_registry.lock().await;
    registry.write_to_terminal(&id, input.as_bytes()).map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resize_terminal(id: String, cols: u16, rows: u16, state: State<'_, AppState>) -> Result<bool, String> {
    let registry = state.process_registry.lock().await;
    registry.resize_terminal(&id, cols, rows).map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn close_terminal(id: String, state: State<'_, AppState>) -> Result<bool, String> {
    let registry = state.process_registry.lock().await;
    registry.close_terminal(&id).map(|_| true).map_err(|e| e.to_string())
}
