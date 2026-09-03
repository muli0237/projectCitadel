use std::fs;
use std::sync::Arc;
use parking_lot::RwLock;
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, Networks, System};
use crate::models::system::{DiskInfo, NetworkInterfaceInfo, ProcessSummary, SystemSnapshot};

pub struct MetricsService {
    system: Arc<RwLock<System>>,
    disks: Arc<RwLock<Disks>>,
    networks: Arc<RwLock<Networks>>,
}

impl MetricsService {
    pub fn new() -> Self {
        let mut sys = System::new_with_specifics(
            sysinfo::RefreshKind::new()
                .with_cpu(CpuRefreshKind::everything())
                .with_memory(MemoryRefreshKind::everything())
                .with_processes(sysinfo::ProcessRefreshKind::everything()),
        );
        sys.refresh_all();

        let disks = Disks::new_with_refreshed_list();
        let networks = Networks::new_with_refreshed_list();

        Self {
            system: Arc::new(RwLock::new(sys)),
            disks: Arc::new(RwLock::new(disks)),
            networks: Arc::new(RwLock::new(networks)),
        }
    }

    /// Collects real system snapshot from Linux host without mock fallback
    pub fn get_snapshot(&self) -> SystemSnapshot {
        let mut sys = self.system.write();
        sys.refresh_cpu();
        sys.refresh_memory();
        sys.refresh_processes();

        // 1. Host identity & OS release details
        let os_release_content = fs::read_to_string("/etc/os-release").unwrap_or_default();
        let mut os_name = System::name().unwrap_or_else(|| "Linux".to_string());
        let mut os_id = None;

        for line in os_release_content.lines() {
            if let Some(stripped) = line.strip_prefix("PRETTY_NAME=") {
                os_name = stripped.trim_matches('"').to_string();
            } else if let Some(stripped) = line.strip_prefix("ID=") {
                os_id = Some(stripped.trim_matches('"').to_string());
            }
        }

        let is_kali = os_name.to_lowercase().contains("kali")
            || os_id.as_deref().unwrap_or_default().to_lowercase().contains("kali");

        let kernel_ver = System::kernel_version();
        let hostname = System::host_name().unwrap_or_else(|| "citadel-node".to_string());

        // 2. Metrics calculation
        let cpu_usage = sys.global_cpu_info().cpu_usage();
        let cpu_core_count = sys.cpus().len();
        let mem_used = sys.used_memory();
        let mem_total = sys.total_memory();
        let swap_used = sys.used_swap();
        let swap_total = sys.total_swap();
        let uptime = System::uptime();

        // 3. Top active processes (sorted by CPU/memory)
        let mut processes: Vec<ProcessSummary> = sys
            .processes()
            .iter()
            .map(|(pid, proc_info)| ProcessSummary {
                pid: pid.as_u32(),
                name: proc_info.name().to_string(),
                cpu_usage: proc_info.cpu_usage(),
                memory_bytes: proc_info.memory(),
                status: format!("{:?}", proc_info.status()),
                user: proc_info.user_id().map(|u| u.to_string()),
            })
            .collect();

        processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
        processes.truncate(15);

        // 4. Mounted Storage devices
        let mut disks_guard = self.disks.write();
        disks_guard.refresh_list();
        let disk_infos: Vec<DiskInfo> = disks_guard
            .iter()
            .map(|d| DiskInfo {
                name: d.name().to_string_lossy().to_string(),
                mount_point: d.mount_point().to_string_lossy().to_string(),
                filesystem: d.file_system().to_string_lossy().to_string(),
                total_bytes: d.total_space(),
                available_bytes: d.available_space(),
                is_removable: d.is_removable(),
                is_read_only: d.available_space() == 0,
            })
            .collect();

        // 5. Network counters
        let mut net_guard = self.networks.write();
        net_guard.refresh_list();
        let net_infos: Vec<NetworkInterfaceInfo> = net_guard
            .iter()
            .map(|(name, data)| NetworkInterfaceInfo {
                name: name.clone(),
                received_bytes: data.received(),
                transmitted_bytes: data.transmitted(),
                is_up: data.received() > 0 || data.transmitted() > 0,
            })
            .collect();

        SystemSnapshot {
            hostname,
            os_name,
            os_id,
            kernel_version: kernel_ver,
            is_kali_linux: is_kali,
            cpu_usage_percent: cpu_usage,
            cpu_core_count,
            memory_used_bytes: mem_used,
            memory_total_bytes: mem_total,
            swap_used_bytes: swap_used,
            swap_total_bytes: swap_total,
            uptime_seconds: uptime,
            process_count: sys.processes().len(),
            top_processes: processes,
            disks: disk_infos,
            network_interfaces: net_infos,
            collected_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}
