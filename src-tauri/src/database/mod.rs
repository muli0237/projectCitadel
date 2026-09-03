use rusqlite::{Connection, Result as SqlResult};
use std::path::Path;
use crate::errors::{CitadelError, Result};

pub struct DatabaseManager;

impl DatabaseManager {
    /// Opens connection with safe journal mode for removable media
    pub fn open(db_path: &Path) -> Result<Connection> {
        let conn = Connection::open(db_path).map_err(|e| CitadelError::DatabaseError(e.to_string()))?;

        // Enable Write-Ahead Logging & robust integrity checks
        conn.pragma_update(None, "journal_mode", "WAL")
            .map_err(|e| CitadelError::DatabaseError(e.to_string()))?;
        conn.pragma_update(None, "synchronous", "FULL")
            .map_err(|e| CitadelError::DatabaseError(e.to_string()))?;
        conn.pragma_update(None, "foreign_keys", "ON")
            .map_err(|e| CitadelError::DatabaseError(e.to_string()))?;

        Self::run_migrations(&conn)?;
        Ok(conn)
    }

    /// Creates relational tables if they do not exist
    pub fn run_migrations(conn: &Connection) -> Result<()> {
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                category TEXT NOT NULL,
                path TEXT NOT NULL,
                repository_url TEXT,
                tags TEXT,
                pinned INTEGER DEFAULT 0,
                archived INTEGER DEFAULT 0,
                preferred_shell TEXT,
                created_at TEXT NOT NULL,
                last_opened_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                tags TEXT,
                project_id TEXT,
                template_type TEXT,
                pinned INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS audit_entries (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                action_type TEXT NOT NULL,
                details TEXT NOT NULL,
                target TEXT,
                executed_by TEXT NOT NULL,
                exit_code INTEGER,
                duration_ms INTEGER,
                severity TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_entries(timestamp);
            CREATE INDEX IF NOT EXISTS idx_notes_project ON notes(project_id);
            "
        ).map_err(|e| CitadelError::DatabaseError(e.to_string()))?;

        Ok(())
    }
}
