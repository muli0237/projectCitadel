use crate::models::tools::{ToolDefinition, ToolchainSnapshot};
use crate::services::tool_discovery_service::ToolDiscoveryService;

#[tauri::command]
pub async fn scan_tool_registry() -> Result<Vec<ToolDefinition>, String> {
    Ok(ToolDiscoveryService::get_allowlisted_tools())
}

#[tauri::command]
pub async fn discover_toolchain() -> Result<ToolchainSnapshot, String> {
    Ok(ToolDiscoveryService::get_toolchain_snapshot())
}
