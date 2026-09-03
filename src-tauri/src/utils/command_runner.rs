use std::process::{Command, Stdio};
use std::time::Duration;
use crate::errors::{CitadelError, Result};

pub struct SafeCommandRunner;

impl SafeCommandRunner {
    /// Executes a binary with argument array, strict timeout, and bounded output capture
    pub fn run_with_timeout(
        program: &str,
        args: &[&str],
        timeout_ms: u64,
    ) -> Result<(bool, String, String)> {
        let mut cmd = Command::new(program);
        cmd.args(args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .stdin(Stdio::null());

        let mut child = cmd.spawn().map_err(|e| {
            CitadelError::Process(format!("Failed to spawn '{}': {}", program, e))
        })?;

        let start = std::time::Instant::now();
        let timeout = Duration::from_millis(timeout_ms);

        loop {
            match child.try_wait() {
                Ok(Some(status)) => {
                    let output = child.wait_with_output().map_err(|e| {
                        CitadelError::Process(format!("Failed to read output: {}", e))
                    })?;

                    // Bounded string decoding (limit to 128KB output to avoid memory ballooning)
                    let stdout_str = String::from_utf8_lossy(&output.stdout);
                    let stderr_str = String::from_utf8_lossy(&output.stderr);

                    let stdout = if stdout_str.len() > 131072 {
                        stdout_str[..131072].to_string()
                    } else {
                        stdout_str.to_string()
                    };

                    let stderr = if stderr_str.len() > 65536 {
                        stderr_str[..65536].to_string()
                    } else {
                        stderr_str.to_string()
                    };

                    return Ok((status.success(), stdout, stderr));
                }
                Ok(None) => {
                    if start.elapsed() >= timeout {
                        let _ = child.kill();
                        return Err(CitadelError::Timeout(format!(
                            "Command '{}' exceeded timeout limit of {}ms",
                            program, timeout_ms
                        )));
                    }
                    std::thread::sleep(Duration::from_millis(15));
                }
                Err(e) => {
                    return Err(CitadelError::Process(format!("Error awaiting child: {}", e)));
                }
            }
        }
    }

    /// Checks if a binary is present in system PATH safely
    pub fn find_executable(name: &str) -> Option<String> {
        if let Ok(path_var) = std::env::var("PATH") {
            for dir in std::env::split_paths(&path_var) {
                let candidate = dir.join(name);
                if candidate.is_file() {
                    #[cfg(unix)]
                    {
                        use std::os::unix::fs::PermissionsExt;
                        if let Ok(meta) = candidate.metadata() {
                            if meta.permissions().mode() & 0o111 != 0 {
                                return Some(candidate.to_string_lossy().to_string());
                            }
                        }
                    }
                    #[cfg(not(unix))]
                    {
                        return Some(candidate.to_string_lossy().to_string());
                    }
                }
            }
        }
        None
    }
}
