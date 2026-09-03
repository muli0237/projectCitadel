use std::fs;
use tauri::State;
use crate::app_state::AppState;
use crate::utils::paths::PathResolver;
use crate::utils::validation::Validator;

#[tauri::command]
pub async fn validate_custom_asset(relative_path: String, state: State<'_, AppState>) -> Result<bool, String> {
    let full_path = PathResolver::sanitize_subpath(&state.portable_root, &relative_path)
        .map_err(|e| e.to_string())?;

    if !full_path.exists() {
        return Err("Asset file does not exist in workspace".into());
    }

    let ext = full_path.extension().and_then(|s| s.to_str()).unwrap_or("");
    if !Validator::validate_asset_extension(ext) {
        return Err(format!("Asset extension '.{}' is not permitted", ext));
    }

    let meta = fs::metadata(&full_path).map_err(|e| e.to_string())?;
    if !Validator::validate_asset_size(meta.len(), 15) {
        return Err("Asset exceeds 15MB file size limit".into());
    }

    Ok(true)
}

#[tauri::command]
pub async fn read_workspace_asset(relative_path: String, state: State<'_, AppState>) -> Result<Vec<u8>, String> {
    let full_path = PathResolver::sanitize_subpath(&state.portable_root, &relative_path)
        .map_err(|e| e.to_string())?;

    if !full_path.exists() {
        return Err("Asset not found".into());
    }

    fs::read(&full_path).map_err(|e| e.to_string())
}
