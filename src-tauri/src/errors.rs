use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "type", content = "message")]
pub enum CitadelError {
    #[error("Workspace unavailable: {0}")]
    WorkspaceUnavailable(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Tool unavailable: {0}")]
    ToolUnavailable(String),

    #[error("Command timed out: {0}")]
    Timeout(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Filesystem failure: {0}")]
    Filesystem(String),

    #[error("Security or sandbox violation: {0}")]
    Security(String),

    #[error("Terminal PTY error: {0}")]
    Terminal(String),

    #[error("Process execution error: {0}")]
    Process(String),

    #[error("Container runtime error: {0}")]
    Container(String),

    #[error("Git error: {0}")]
    Git(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<std::io::Error> for CitadelError {
    fn from(err: std::io::Error) -> Self {
        CitadelError::Filesystem(err.to_string())
    }
}

impl From<rusqlite::Error> for CitadelError {
    fn from(err: rusqlite::Error) -> Self {
        CitadelError::Database(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, CitadelError>;
