use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSnapshot {
    pub hostname: String,
    pub os_name: String,
    pub os_id: Option<String>,
    pub kernel_version: Option<String>,
    pub is_kali_linux: bool,
    pub cpu_usage_percent: f32,
    pub cpu_core_count: usize,
    pub memory_used_bytes: u64,
    pub memory_total_bytes: u64,
    pub swap_used_bytes: u64,
    pub swap_total_bytes: u64,
    pub uptime_seconds: u64,
    pub process_count: usize,
    pub top_processes: Vec<ProcessSummary>,
    pub disks: Vec<DiskInfo>,
    pub network_interfaces: Vec<NetworkInterfaceInfo>,
    pub collected_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessSummary {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_bytes: u64,
    pub status: String,
    pub user: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub filesystem: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
    pub is_removable: bool,
    pub is_read_only: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInterfaceInfo {
    pub name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
    pub is_up: bool,
}
