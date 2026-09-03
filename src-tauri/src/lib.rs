pub mod app_state;
pub mod commands;
pub mod errors;
pub mod models;
pub mod services;
pub mod utils;

#[cfg(test)]
pub mod tests;

use app_state::AppState;
use services::boot_service::BootService;
use services::workspace_service::WorkspaceService;
use utils::paths::PathResolver;

pub fn run() {
    // Initialize structured local logs without allowing logger configuration to stop startup.
    let _ = tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info,citadel=debug")),
        )
        .try_init();

    tracing::info!("Initializing Citadel Portable Operations Workspace...");

    let portable_root = PathResolver::resolve_portable_root();
    tracing::info!(root = ?portable_root, "Resolved portable root");

    if let Err(error) = WorkspaceService::ensure_directories(&portable_root) {
        tracing::error!(?error, "Unable to initialize workspace directories");
    }

    let lock_path = portable_root.join("workspace.lock");
    if let Err(error) = WorkspaceService::acquire_lock(&lock_path) {
        tracing::error!(?error, "Unable to acquire workspace lock; another instance may be active");
    }

    let db_path = portable_root.join("database").join("citadel.db");
    let db_conn = match WorkspaceService::init_database(&db_path) {
        Ok(connection) => Some(connection),
        Err(error) => {
            tracing::error!(?error, "Unable to initialize metadata database; continuing in degraded mode");
            None
        }
    };

    let initial_boot = BootService::perform_boot_sequence(&portable_root);
    let state = AppState::new(portable_root, initial_boot, db_conn);

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(tauri::generate_handler![
            commands::boot::start_boot_sequence,
            commands::boot::get_boot_report,
            commands::boot::retry_boot_checks,
            commands::boot::complete_launch_sequence,
            commands::system::get_system_snapshot,
            commands::system::get_drive_health,
            commands::workspace::get_workspace_status,
            commands::workspace::select_workspace_root,
            commands::workspace::recover_stale_workspace_lock,
            commands::workspace::prepare_safe_eject,
            commands::workspace::list_projects,
            commands::workspace::create_project,
            commands::workspace::create_workspace_file,
            commands::workspace::save_workspace_file,
            commands::workspace::delete_workspace_file,
            commands::workspace::read_workspace_file,
            commands::tools::scan_tool_registry,
            commands::tools::discover_toolchain,
            commands::containers::list_containers,
            commands::git::get_git_status,
            commands::python::get_python_environments,
            commands::notes::list_notes,
            commands::notes::read_note,
            commands::notes::write_note,
            commands::terminal::create_terminal_session,
            commands::terminal::write_terminal_input,
            commands::terminal::resize_terminal,
            commands::terminal::close_terminal,
            commands::assets::validate_custom_asset,
            commands::assets::read_workspace_asset,
        ])
        .run(tauri::generate_context!())
        .unwrap_or_else(|error| tracing::error!(?error, "Citadel application exited with an error"));
}
