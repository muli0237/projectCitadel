use tauri::State;
use crate::app_state::AppState;
use crate::models::tools::PythonEnvironmentInfo;
use crate::services::tool_discovery_service::ToolDiscoveryService;

#[tauri::command]
pub async fn get_python_environments(state: State<'_, AppState>) -> Result<Vec<PythonEnvironmentInfo>, String> {
    Ok(ToolDiscoveryService::list_python_environments(&state.portable_root))
}
