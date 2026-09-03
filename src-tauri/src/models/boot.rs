use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum BootStage {
    Ignition,
    CoreAssembly,
    WorkspaceVerification,
    ToolchainDiscovery,
    ControlPlaneReady,
    RecoveryMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum BootCheckStatus {
    Pending,
    Running,
    Success,
    Warning,
    Error,
    Unavailable,
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum BootCheckCategory {
    Host,
    Storage,
    Database,
    Security,
    Toolchain,
    Runtime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BootCheck {
    pub id: String,
    pub name: String,
    pub category: BootCheckCategory,
    pub status: BootCheckStatus,
    pub details: Option<String>,
    pub duration_ms: Option<u64>,
    pub is_required: bool,
    pub timestamp: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BootProgressEvent {
    pub stage: String,
    pub check_id: String,
    pub status: String,
    pub message: String,
    pub progress_percentage: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DriveHealthReport {
    pub device_name: String,
    pub mount_point: String,
    pub filesystem: String,
    pub is_removable: bool,
    pub is_read_only: bool,
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub usage_percentage: u8,
    pub estimated_wear_level: u8,
    pub safe_to_eject: bool,
    pub unmount_pending: bool,
    pub last_sync_timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BootReport {
    pub current_stage: BootStage,
    pub progress_percentage: f32,
    pub checks: Vec<BootCheck>,
    pub required_checks_complete: bool,
    pub can_enter_command_center: bool,
    pub recoverable_errors: Vec<String>,
    pub fatal_errors: Vec<String>,
    pub timestamp: String,
    pub workspace_root: String,
    pub drive_health: Option<DriveHealthReport>,
    pub toolchain: Option<crate::models::tools::ToolchainSnapshot>,
}
