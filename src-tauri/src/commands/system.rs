use tauri::State;
use crate::app_state::AppState;
use crate::models::boot::DriveHealthReport;
use crate::models::system::SystemSnapshot;

#[tauri::command]
pub async fn get_system_snapshot(state: State<'_, AppState>) -> Result<SystemSnapshot, String> {
    let snapshot = state.metrics_service.get_snapshot();
    let mut cache = state.metrics_cache.write().await;
    *cache = Some(snapshot.clone());
    Ok(snapshot)
}

#[tauri::command]
pub async fn get_drive_health(state: State<'_, AppState>) -> Result<DriveHealthReport, String> {
    let report = crate::services::boot_service::BootService::perform_boot_sequence(&state.portable_root);
    if let Some(drive) = report.drive_health {
        Ok(drive)
    } else {
        Err("Drive health diagnostic unavailable".into())
    }
}
