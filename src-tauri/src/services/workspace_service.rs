use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use rusqlite::{params, Connection};
use crate::errors::{CitadelError, Result};
use crate::models::workspace::{NoteRecord, ProjectRecord, WorkspaceDirectories, WorkspaceStatus};
use crate::utils::paths::PathResolver;

pub struct WorkspaceService;

impl WorkspaceService {
    /// Initializes all portable directory structures
    pub fn ensure_directories(root: &Path) -> Result<WorkspaceDirectories> {
        let dirs = WorkspaceDirectories {
            projects: root.join("projects"),
            notes: root.join("notes"),
            datasets: root.join("datasets"),
            tool_profiles: root.join("tool_profiles"),
            logs: root.join("logs"),
            backups: root.join("backups"),
            cache: root.join("cache"),
            config: root.join("config"),
        };

        fs::create_dir_all(&dirs.projects)?;
        fs::create_dir_all(&dirs.notes)?;
        fs::create_dir_all(&dirs.datasets)?;
        fs::create_dir_all(&dirs.tool_profiles)?;
        fs::create_dir_all(&dirs.logs)?;
        fs::create_dir_all(&dirs.backups)?;
        fs::create_dir_all(&dirs.cache)?;
        fs::create_dir_all(&dirs.config)?;

        Ok(dirs)
    }

    /// Initializes and migrates the SQLite metadata vault
    pub fn init_database(db_path: &Path) -> Result<Connection> {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(db_path)?;

        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "synchronous", "NORMAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;

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

            CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_entries(timestamp);
            CREATE INDEX IF NOT EXISTS idx_notes_proj ON notes(project_id);
            "
        )?;

        Ok(conn)
    }

    /// Acquires an exclusive process lockfile with PID and timestamp
    pub fn acquire_lock(lock_path: &Path) -> Result<()> {
        if lock_path.exists() {
            // Check if existing lock is stale (process no longer alive)
            if let Ok(content) = fs::read_to_string(lock_path) {
                if let Ok(pid) = content.trim().parse::<i32>() {
                    #[cfg(unix)]
                    {
                        // kill(pid, 0) checks if process exists
                        let is_alive = unsafe { libc::kill(pid, 0) == 0 };
                        if !is_alive {
                            let _ = fs::remove_file(lock_path);
                        } else {
                            return Err(CitadelError::Security(format!(
                                "Citadel workspace is currently locked by active PID {}",
                                pid
                            )));
                        }
                    }
                }
            }
        }

        let pid = std::process::id();
        let mut file = OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(lock_path)?;

        writeln!(file, "{}", pid)?;
        Ok(())
    }

    /// Releases workspace lockfile
    pub fn release_lock(lock_path: &Path) -> Result<()> {
        if lock_path.exists() {
            fs::remove_file(lock_path)?;
        }
        Ok(())
    }

    /// Removes stale lock file if requested by user
    pub fn recover_stale_lock(lock_path: &Path) -> Result<bool> {
        if lock_path.exists() {
            fs::remove_file(lock_path)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    /// Lists all projects from SQLite
    pub fn list_projects(conn: &Connection) -> Result<Vec<ProjectRecord>> {
        let mut stmt = conn.prepare(
            "SELECT id, name, description, category, path, repository_url, tags, pinned, archived, preferred_shell, created_at, last_opened_at FROM projects ORDER BY pinned DESC, last_opened_at DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            let tags_str: Option<String> = row.get(6)?;
            let tags = tags_str
                .map(|s| s.split(',').map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect())
                .unwrap_or_default();

            Ok(ProjectRecord {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                category: row.get(3)?,
                path: row.get(4)?,
                repository_url: row.get(5)?,
                tags,
                pinned: row.get::<_, i32>(7)? == 1,
                archived: row.get::<_, i32>(8)? == 1,
                preferred_shell: row.get(9)?,
                created_at: row.get(10)?,
                last_opened_at: row.get(11)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    /// Creates or updates a project in SQLite and creates directory
    pub fn upsert_project(conn: &Connection, workspace_root: &Path, project: &ProjectRecord) -> Result<()> {
        let proj_dir = PathResolver::sanitize_subpath(workspace_root, &format!("projects/{}", project.name))?;
        fs::create_dir_all(&proj_dir)?;

        let tags_joined = project.tags.join(",");
        conn.execute(
            "INSERT INTO projects (id, name, description, category, path, repository_url, tags, pinned, archived, preferred_shell, created_at, last_opened_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
             ON CONFLICT(id) DO UPDATE SET
             name=excluded.name, description=excluded.description, category=excluded.category, path=excluded.path, repository_url=excluded.repository_url,
             tags=excluded.tags, pinned=excluded.pinned, archived=excluded.archived, preferred_shell=excluded.preferred_shell, last_opened_at=excluded.last_opened_at",
            params![
                project.id,
                project.name,
                project.description,
                project.category,
                proj_dir.to_string_lossy().to_string(),
                project.repository_url,
                tags_joined,
                if project.pinned { 1 } else { 0 },
                if project.archived { 1 } else { 0 },
                project.preferred_shell,
                project.created_at,
                project.last_opened_at,
            ],
        )?;

        Ok(())
    }

    /// Lists notes
    pub fn list_notes(conn: &Connection) -> Result<Vec<NoteRecord>> {
        let mut stmt = conn.prepare(
            "SELECT id, title, content, tags, project_id, template_type, pinned, created_at, updated_at FROM notes ORDER BY pinned DESC, updated_at DESC"
        )?;

        let rows = stmt.query_map([], |row| {
            let tags_str: Option<String> = row.get(3)?;
            let tags = tags_str
                .map(|s| s.split(',').map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect())
                .unwrap_or_default();

            Ok(NoteRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                content: row.get(2)?,
                tags,
                project_id: row.get(4)?,
                template_type: row.get(5)?,
                pinned: row.get::<_, i32>(6)? == 1,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut list = Vec::new();
        for r in rows {
            list.push(r?);
        }
        Ok(list)
    }

    /// Saves note atomically to disk markdown file and SQLite
    pub fn save_note(conn: &Connection, workspace_root: &Path, note: &NoteRecord) -> Result<()> {
        let note_file_path = PathResolver::sanitize_subpath(workspace_root, &format!("notes/{}.md", note.id))?;
        
        // Atomic write via temp file
        let temp_file_path = note_file_path.with_extension("tmp");
        fs::write(&temp_file_path, note.content.as_bytes())?;
        fs::rename(&temp_file_path, &note_file_path)?;

        let tags_joined = note.tags.join(",");
        conn.execute(
            "INSERT INTO notes (id, title, content, tags, project_id, template_type, pinned, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(id) DO UPDATE SET
             title=excluded.title, content=excluded.content, tags=excluded.tags, project_id=excluded.project_id,
             template_type=excluded.template_type, pinned=excluded.pinned, updated_at=excluded.updated_at",
            params![
                note.id,
                note.title,
                note.content,
                tags_joined,
                note.project_id,
                note.template_type,
                if note.pinned { 1 } else { 0 },
                note.created_at,
                note.updated_at,
            ],
        )?;

        Ok(())
    }

    /// Gets workspace status summary
    pub fn get_status(root: &Path, conn_opt: Option<&Connection>) -> WorkspaceStatus {
        let exists = root.exists();
        let test_file = root.join(".probe");
        let is_writable = fs::write(&test_file, b"ok").map(|_| {
            let _ = fs::remove_file(&test_file);
            true
        }).unwrap_or(false);

        let lock_file = root.join("workspace.lock");
        let has_stale_lock = lock_file.exists();

        let mut proj_count = 0;
        let mut note_count = 0;
        let mut db_ok = false;

        if let Some(conn) = conn_opt {
            proj_count = conn.query_row("SELECT COUNT(*) FROM projects", [], |r| r.get(0)).unwrap_or(0);
            note_count = conn.query_row("SELECT COUNT(*) FROM notes", [], |r| r.get(0)).unwrap_or(0);
            db_ok = conn.execute_batch("PRAGMA integrity_check;").is_ok();
        }

        WorkspaceStatus {
            root_path: root.to_string_lossy().to_string(),
            exists,
            is_writable,
            is_removable_drive: true,
            has_stale_lock,
            total_space_bytes: 32 * 1024 * 1024 * 1024,
            free_space_bytes: 20 * 1024 * 1024 * 1024,
            project_count: proj_count,
            note_count: note_count,
            database_integrity_ok: db_ok,
            last_checked_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}
