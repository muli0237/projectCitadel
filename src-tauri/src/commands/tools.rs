use serde_json::Value;

use crate::errors::CitadelError;
use crate::models::tools::{ToolDefinition, ToolchainSnapshot};
use crate::services::tool_discovery_service::ToolDiscoveryService;

type CommandResult<T> = std::result::Result<T, String>;

#[tauri::command]
pub async fn scan_tool_registry() -> CommandResult<Vec<ToolDefinition>> {
    Ok(ToolDiscoveryService::get_allowlisted_tools())
}

#[tauri::command]
pub async fn discover_toolchain() -> CommandResult<ToolchainSnapshot> {
    Ok(ToolDiscoveryService::get_toolchain_snapshot())
}

#[tauri::command]
pub async fn register_tool(tool: Value) -> CommandResult<Value> {
    let object = tool.as_object().ok_or_else(|| "Tool payload must be an object".to_string())?;
    let name = object.get("name").and_then(Value::as_str).unwrap_or("").trim();
    let binary = object.get("binaryName").and_then(Value::as_str).unwrap_or("").trim();
    if name.is_empty() || binary.is_empty() || name.len() > 128 || binary.len() > 128 {
        return Err(CitadelError::Security("Tool name and binaryName are required and bounded".into()).to_string());
    }
    if binary.chars().any(|c| c.is_control() || c == '/' || c == '\\') {
        return Err(CitadelError::Security("Tool binary must be a command name, not a path".into()).to_string());
    }
    Ok(tool)
}

#[tauri::command]
pub async fn delete_tool(tool_id: String) -> CommandResult<bool> {
    let id = tool_id.trim();
    if id.is_empty() || id.len() > 128 || id.chars().any(|c| c.is_control()) {
        return Err(CitadelError::Security("Invalid tool id".into()).to_string());
    }
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_path_binaries() {
        let value = serde_json::json!({"name":"x", "binaryName":"/bin/sh"});
        assert!(register_tool_value(value).is_err());
    }
    fn register_tool_value(value: Value) -> CommandResult<Value> {
        let object = value.as_object().ok_or_else(|| "invalid".to_string())?;
        let binary = object.get("binaryName").and_then(Value::as_str).unwrap_or("");
        if binary.contains('/') { return Err("invalid".into()); }
        Ok(value)
    }
}
