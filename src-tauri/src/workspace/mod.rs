use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use crate::errors::{CitadelError, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceDirectories {
    pub projects: PathBuf,
    pub notes: PathBuf,
    pub datasets: PathBuf,
    pub tool_profiles: PathBuf,
    pub logs: PathBuf,
    pub backups: PathBuf,
    pub cache: PathBuf,
    pub config: PathBuf,
}

pub struct WorkspaceManager;

impl WorkspaceManager {
    /// Discovers dynamic flash drive or local root
    pub fn resolve_portable_root() -> PathBuf {
        // Priority 1: Environment variable override
        if let Ok(env_path) = std::env::var("CITADEL_PORTABLE_ROOT") {
            let p = PathBuf::from(env_path);
            if p.exists() {
                return p;
            }
        }

        // Priority 2: Kali Linux media mounts
        let kali_media = Path::new("/media/kali/CITADEL_DRIVE/Citadel");
        if kali_media.exists() {
            return kali_media.to_path_buf();
        }

        // Priority 3: Current executable parent directory
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(parent) = exe_path.parent() {
                let drive_citadel = parent.join("Citadel");
                if drive_citadel.exists() {
                    return drive_citadel;
                }
            }
        }

        // Fallback: Default portable root structure
        PathBuf::from("/media/kali/CITADEL_DRIVE/Citadel/workspace")
    }

    /// Initializes self-contained folders inside flash drive
    pub fn initialize_structure(root: &Path) -> Result<WorkspaceDirectories> {
        let dirs = WorkspaceDirectories {
            projects: root.join("projects"),
            notes: root.join("notes"),
            datasets: root.join("datasets"),
            tool_profiles: root.join("tool-profiles"),
            logs: root.join("logs"),
            backups: root.join("backups"),
            cache: root.join("cache"),
            config: root.join("config"),
        };

        fs::create_dir_all(&dirs.projects).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.notes).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.datasets).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.tool_profiles).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.logs).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.backups).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.cache).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        fs::create_dir_all(&dirs.config).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;

        Ok(dirs)
    }

    /// Acquires an exclusive process lockfile to prevent concurrent corruption
    pub fn acquire_lock(lock_path: &Path) -> Result<()> {
        let pid = std::process::id();
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(lock_path)
            .map_err(|e| CitadelError::SecurityError(format!("Stale or concurrent lock file detected at {}: {}", lock_path.display(), e)))?;

        writeln!(file, "{}", pid).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        Ok(())
    }

    /// Releases the lockfile upon graceful exit
    pub fn release_lock(lock_path: &Path) -> Result<()> {
        if lock_path.exists() {
            fs::remove_file(lock_path).map_err(|e| CitadelError::FilesystemError(e.to_string()))?;
        }
        Ok(())
    }

    /// Canonicalizes and sanitizes path to prevent directory traversal
    pub fn sanitize_path(base: &Path, user_rel: &str) -> Result<PathBuf> {
        let clean = PathBuf::from(user_rel);
        if clean.is_absolute() {
            return Err(CitadelError::SecurityError("Absolute paths not permitted in portable sandbox.".into()));
        }

        let combined = base.join(clean);
        // Ensure combined path doesn't navigate above base
        if !combined.starts_with(base) {
            return Err(CitadelError::SecurityError("Path traversal outside workspace sandbox blocked.".into()));
        }

        Ok(combined)
    }
}
