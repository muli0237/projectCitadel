use std::path::{Path, PathBuf};
use crate::errors::{CitadelError, Result};

pub struct PathResolver;

impl PathResolver {
    /// Dynamically resolves portable root directory with explicit prioritized fallback
    pub fn resolve_portable_root() -> PathBuf {
        // 1. Explicit Environment Variable
        if let Ok(env_val) = std::env::var("CITADEL_PORTABLE_ROOT") {
            let p = PathBuf::from(env_val.trim());
            if p.exists() {
                return p;
            }
        }

        // 2. Kali Linux removable mount point
        let kali_mount = Path::new("/media/kali/CITADEL_DRIVE/Citadel");
        if kali_mount.exists() {
            return kali_mount.to_path_buf();
        }

        // 3. Generic removable media mounts (/run/media/$USER/*, /media/$USER/*)
        if let Ok(user) = std::env::var("USER") {
            let run_media = PathBuf::from(format!("/run/media/{}/CITADEL_DRIVE/Citadel", user));
            if run_media.exists() {
                return run_media;
            }
            let media_user = PathBuf::from(format!("/media/{}/CITADEL_DRIVE/Citadel", user));
            if media_user.exists() {
                return media_user;
            }
        }

        // 4. Executable adjacent directory
        if let Ok(exe) = std::env::current_exe() {
            if let Some(parent) = exe.parent() {
                let adj = parent.join("Citadel");
                if adj.exists() {
                    return adj;
                }
            }
        }

        // 5. User Home Local-first Fallback
        if let Some(home) = dirs::home_dir() {
            let home_citadel = home.join(".citadel").join("workspace");
            return home_citadel;
        }

        // 6. Final Static Fallback
        PathBuf::from("/media/kali/CITADEL_DRIVE/Citadel/workspace")
    }

    /// Sanitizes and prevents directory traversal outside workspace
    pub fn sanitize_subpath(base: &Path, rel: &str) -> Result<PathBuf> {
        let clean = Path::new(rel);
        if clean.is_absolute() {
            return Err(CitadelError::Security(
                "Absolute paths are forbidden inside portable sandbox".into(),
            ));
        }

        let combined = base.join(clean);
        // Canonicalize when existing or check lexical prefix
        if let Ok(canon_base) = base.canonicalize() {
            if let Ok(canon_target) = combined.canonicalize() {
                if !canon_target.starts_with(&canon_base) {
                    return Err(CitadelError::Security(
                        "Path traversal outside portable workspace is strictly blocked".into(),
                    ));
                }
                return Ok(canon_target);
            }
        }

        // Lexical fallback
        if combined.to_string_lossy().contains("..") {
            return Err(CitadelError::Security("Parent directory traversal forbidden".into()));
        }

        Ok(combined)
    }
}
