use tauri::State;
use crate::app_state::AppState;
use crate::models::boot::BootReport;
use crate::services::boot_service::BootService;

#[tauri::command]
pub async fn start_boot_sequence(state: State<'_, AppState>) -> Result<BootReport, String> {
    let report = BootService::perform_boot_sequence(&state.portable_root);
    let mut cache = state.boot_state.write().await;
    *cache = report.clone();
    Ok(report)
}

#[tauri::command]
pub async fn get_boot_report(state: State<'_, AppState>) -> Result<BootReport, String> {
    let report = BootService::perform_boot_sequence(&state.portable_root);
    let mut cache = state.boot_state.write().await;
    *cache = report.clone();
    Ok(report)
}

#[tauri::command]
pub async fn retry_boot_checks(state: State<'_, AppState>) -> Result<BootReport, String> {
    let report = BootService::perform_boot_sequence(&state.portable_root);
    let mut cache = state.boot_state.write().await;
    *cache = report.clone();
    Ok(report)
}

#[tauri::command]
pub async fn complete_launch_sequence() -> Result<bool, String> {
    Ok(true)
}
