use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};
use rusqlite::Connection;
use crate::models::boot::BootReport;
use crate::models::system::SystemSnapshot;
use crate::services::metrics_service::MetricsService;
use crate::services::process_service::ProcessRegistry;

pub struct AppState {
    pub portable_root: PathBuf,
    pub database: Arc<Mutex<Option<Connection>>>,
    pub metrics_cache: Arc<RwLock<Option<SystemSnapshot>>>,
    pub boot_state: Arc<RwLock<BootReport>>,
    pub process_registry: Arc<Mutex<ProcessRegistry>>,
    pub metrics_service: Arc<MetricsService>,
}

impl AppState {
    pub fn new(root: PathBuf, initial_boot: BootReport, db: Option<Connection>) -> Self {
        Self {
            portable_root: root,
            database: Arc::new(Mutex::new(db)),
            metrics_cache: Arc::new(RwLock::new(None)),
            boot_state: Arc::new(RwLock::new(initial_boot)),
            process_registry: Arc::new(Mutex::new(ProcessRegistry::new())),
            metrics_service: Arc::new(MetricsService::new()),
        }
    }
}
