use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: String,
    pub action_type: String,
    pub details: String,
    pub target: Option<String>,
    pub executed_by: String,
    pub exit_code: Option<i32>,
    pub duration_ms: Option<u64>,
    pub severity: String, // "info" | "warning" | "error" | "security"
}
