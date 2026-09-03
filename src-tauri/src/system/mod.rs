use serde::{Deserialize, Serialize};
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, Networks, System};

#[derive(Debug, Serialize, Deserialize)]
pub struct HostMetrics {
    pub os_name: String,
    pub kernel_version: String,
    pub hostname: String,
    pub is_kali_linux: bool,
    pub cpu_usage_percent: f32,
    pub total_ram_bytes: u64,
    pub used_ram_bytes: u64,
}

pub struct SystemTelemetry;

impl SystemTelemetry {
    pub fn get_metrics() -> HostMetrics {
        let mut sys = System::new_all();
        sys.refresh_all();

        let is_kali = std::fs::read_to_string("/etc/os-release")
            .map(|content| content.contains("Kali"))
            .unwrap_or(false);

        HostMetrics {
            os_name: System::name().unwrap_or_else(|| "Kali GNU/Linux".into()),
            kernel_version: System::kernel_version().unwrap_or_else(|| "6.8.0-kali".into()),
            hostname: System::host_name().unwrap_or_else(|| "citadel-node".into()),
            is_kali_linux: is_kali,
            cpu_usage_percent: sys.global_cpu_info().cpu_usage(),
            total_ram_bytes: sys.total_memory(),
            used_ram_bytes: sys.used_memory(),
        }
    }
}
