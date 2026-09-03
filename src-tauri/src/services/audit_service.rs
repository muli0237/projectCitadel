use rusqlite::{params, Connection};
use crate::errors::Result;
use crate::models::audit::AuditEntry;

pub struct AuditService;

impl AuditService {
    /// Inserts an audit log entry for user command actions or security operations
    pub fn record_event(conn: &Connection, entry: &AuditEntry) -> Result<()> {
        conn.execute(
            "INSERT INTO audit_entries (id, timestamp, action_type, details, target, executed_by, exit_code, duration_ms, severity)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                entry.id,
                entry.timestamp,
                entry.action_type,
                entry.details,
                entry.target,
                entry.executed_by,
                entry.exit_code,
                entry.duration_ms,
                entry.severity,
            ],
        )?;
        Ok(())
    }

    /// Queries the last N audit entries
    pub fn list_recent_events(conn: &Connection, limit: u32) -> Result<Vec<AuditEntry>> {
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, action_type, details, target, executed_by, exit_code, duration_ms, severity
             FROM audit_entries ORDER BY timestamp DESC LIMIT ?1"
        )?;

        let rows = stmt.query_map([limit], |row| {
            Ok(AuditEntry {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                action_type: row.get(2)?,
                details: row.get(3)?,
                target: row.get(4)?,
                executed_by: row.get(5)?,
                exit_code: row.get(6)?,
                duration_ms: row.get::<_, Option<i64>>(7)?.map(|v| v as u64),
                severity: row.get(8)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }
}
