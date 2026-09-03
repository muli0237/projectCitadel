use std::collections::HashMap;
use std::io::Write;
use std::sync::Arc;
use parking_lot::Mutex;
use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtySize};
use crate::errors::{CitadelError, Result};

pub struct TerminalSession {
    pub id: String,
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
}

pub struct ProcessRegistry {
    sessions: Arc<Mutex<HashMap<String, TerminalSession>>>,
}

impl ProcessRegistry {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Spawns a new interactive PTY terminal session (defaulting to /bin/bash or $SHELL)
    pub fn create_terminal_session(&self, id: &str, cols: u16, rows: u16) -> Result<()> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| CitadelError::Terminal(e.to_string()))?;

        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".into());
        let mut cmd = CommandBuilder::new(shell);
        cmd.env("TERM", "xterm-256color");
        cmd.env("CITADEL_SESSION_ID", id);

        let _child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| CitadelError::Terminal(e.to_string()))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| CitadelError::Terminal(e.to_string()))?;

        let session = TerminalSession {
            id: id.to_string(),
            master: pair.master,
            writer,
        };

        let mut guard = self.sessions.lock();
        guard.insert(id.to_string(), session);

        Ok(())
    }

    /// Writes data to an open PTY session
    pub fn write_to_terminal(&self, id: &str, data: &[u8]) -> Result<()> {
        let mut guard = self.sessions.lock();
        if let Some(session) = guard.get_mut(id) {
            session
                .writer
                .write_all(data)
                .map_err(|e| CitadelError::Terminal(e.to_string()))?;
            session
                .writer
                .flush()
                .map_err(|e| CitadelError::Terminal(e.to_string()))?;
            Ok(())
        } else {
            Err(CitadelError::Terminal(format!("Terminal session '{}' not found", id)))
        }
    }

    /// Resizes an active PTY window
    pub fn resize_terminal(&self, id: &str, cols: u16, rows: u16) -> Result<()> {
        let guard = self.sessions.lock();
        if let Some(session) = guard.get(id) {
            session
                .master
                .resize(PtySize {
                    rows,
                    cols,
                    pixel_width: 0,
                    pixel_height: 0,
                })
                .map_err(|e| CitadelError::Terminal(e.to_string()))?;
            Ok(())
        } else {
            Err(CitadelError::Terminal(format!("Terminal session '{}' not found", id)))
        }
    }

    /// Closes and terminates a PTY session
    pub fn close_terminal(&self, id: &str) -> Result<()> {
        let mut guard = self.sessions.lock();
        guard.remove(id);
        Ok(())
    }
}
