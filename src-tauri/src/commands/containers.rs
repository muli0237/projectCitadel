use crate::models::tools::ContainerSummary;
use crate::services::tool_discovery_service::ToolDiscoveryService;

#[tauri::command]
pub async fn list_containers() -> Result<Vec<ContainerSummary>, String> {
    Ok(ToolDiscoveryService::list_containers())
}
