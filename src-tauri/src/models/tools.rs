use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Availability {
    pub installed: bool,
    pub executable: Option<String>,
    pub version: Option<String>,
    pub error: Option<String>,
}

impl Default for Availability {
    fn default() -> Self {
        Self {
            installed: false,
            executable: None,
            version: None,
            error: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ToolchainSnapshot {
    pub git: Availability,
    pub docker: Availability,
    pub podman: Availability,
    pub python: Availability,
    pub node: Availability,
    pub rustc: Availability,
    pub cargo: Availability,
    pub shell: Availability,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SafeLaunchTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub args_template: String,
    pub requires_elevation: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDefinition {
    pub id: String,
    pub name: String,
    pub binary_name: String,
    pub category: String,
    pub description: String,
    pub installed: bool,
    pub binary_path: Option<String>,
    pub version: Option<String>,
    pub required_permission: String,
    pub help_command: String,
    pub safe_launch_templates: Vec<SafeLaunchTemplate>,
    pub doc_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerSummary {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: String,
    pub state: String,
    pub ports: Vec<String>,
    pub runtime: String, // "docker" | "podman"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PythonEnvironmentInfo {
    pub executable_path: String,
    pub version: String,
    pub is_virtualenv: bool,
    pub pip_packages: Vec<String>,
}
