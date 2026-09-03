use tauri::State;
use crate::app_state::AppState;
use crate::utils::command_runner::SafeCommandRunner;
use crate::utils::paths::PathResolver;

#[tauri::command]
pub async fn get_git_status(project_path: Option<String>, state: State<'_, AppState>) -> Result<String, String> {
    let target_dir = if let Some(sub) = project_path {
        PathResolver::sanitize_subpath(&state.portable_root, &sub).map_err(|e| e.to_string())?
    } else {
        state.portable_root.clone()
    };

    if let Some(git_exe) = SafeCommandRunner::find_executable("git") {
        let (success, stdout, stderr) = SafeCommandRunner::run_with_timeout(
            &git_exe,
            &["-C", &target_dir.to_string_lossy(), "status", "--short"],
            2000,
        ).map_err(|e| e.to_string())?;

        if success {
            Ok(stdout)
        } else {
            Err(stderr)
        }
    } else {
        Err("Git binary not found on host machine".into())
    }
}
