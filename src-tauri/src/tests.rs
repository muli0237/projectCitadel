#[cfg(test)]
mod tests {
    use std::path::{Path, PathBuf};
    use crate::services::boot_service::BootService;
    use crate::services::metrics_service::MetricsService;
    use crate::services::tool_discovery_service::ToolDiscoveryService;
    use crate::services::workspace_service::WorkspaceService;
    use crate::utils::command_runner::SafeCommandRunner;
    use crate::utils::paths::PathResolver;
    use crate::utils::validation::Validator;

    #[test]
    fn test_path_sanitization_blocks_traversal() {
        let base = Path::new("/media/kali/CITADEL_DRIVE/Citadel/workspace");
        let malicious_rel = "../../etc/shadow";

        let result = PathResolver::sanitize_subpath(base, malicious_rel);
        assert!(result.is_err(), "Must reject path traversal");
    }

    #[test]
    fn test_path_sanitization_accepts_valid_subpath() {
        let base = Path::new("/tmp/citadel_test_workspace");
        let valid_rel = "projects/web-audit";

        let result = PathResolver::sanitize_subpath(base, valid_rel);
        assert!(result.is_ok());
    }

    #[test]
    fn test_asset_extension_validator() {
        assert!(Validator::validate_asset_extension("webp"));
        assert!(Validator::validate_asset_extension("PNG"));
        assert!(Validator::validate_asset_extension("ogg"));
        assert!(!Validator::validate_asset_extension("exe"));
        assert!(!Validator::validate_asset_extension("sh"));
    }

    #[test]
    fn test_metrics_collection_not_empty() {
        let metrics_service = MetricsService::new();
        let snapshot = metrics_service.get_snapshot();

        assert!(!snapshot.hostname.is_empty());
        assert!(!snapshot.os_name.is_empty());
        assert!(snapshot.cpu_core_count > 0);
        assert!(snapshot.memory_total_bytes > 0);
    }

    #[test]
    fn test_toolchain_discovery() {
        let toolchain = ToolDiscoveryService::get_toolchain_snapshot();
        // Shell must always be discovered on any standard Linux/POSIX system
        assert!(toolchain.shell.installed);
    }

    #[test]
    fn test_safe_command_runner_echo() {
        let res = SafeCommandRunner::run_with_timeout("echo", &["citadel_ok"], 1000);
        assert!(res.is_ok());
        let (success, stdout, _) = res.unwrap();
        assert!(success);
        assert!(stdout.contains("citadel_ok"));
    }

    #[test]
    fn test_database_lifecycle_in_memory() {
        let temp_dir = std::env::temp_dir().join(format!("citadel_test_db_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp_dir);
        let db_file = temp_dir.join("test.db");

        let conn = WorkspaceService::init_database(&db_file);
        assert!(conn.is_ok());

        let conn = conn.unwrap();
        let projects = WorkspaceService::list_projects(&conn);
        assert!(projects.is_ok());
        assert_eq!(projects.unwrap().len(), 0);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_boot_sequence_on_temp_dir() {
        let temp_dir = std::env::temp_dir().join(format!("citadel_boot_test_{}", std::process::id()));
        let _ = std::fs::create_dir_all(&temp_dir);

        let report = BootService::perform_boot_sequence(&temp_dir);
        assert!(report.checks.len() >= 5);
        assert!(report.required_checks_complete);

        let _ = std::fs::remove_dir_all(&temp_dir);
    }
}
