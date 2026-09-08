use serde::{Deserialize, Serialize};

use crate::errors::CitadelError;

type CommandResult<T> = std::result::Result<T, String>;
use crate::models::tools::ContainerSummary;
use crate::utils::command_runner::SafeCommandRunner;

const COMMAND_TIMEOUT_MS: u64 = 30_000;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerPortMapping {
    pub host_port: u16,
    pub container_port: u16,
    #[serde(default = "default_protocol")]
    pub protocol: String,
}

fn default_protocol() -> String { "tcp".into() }

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunContainerRequest {
    pub name: String,
    pub image: String,
    #[serde(default)]
    pub ports: Vec<ContainerPortMapping>,
    #[serde(default)]
    pub env_vars: Vec<EnvironmentVariable>,
    pub command: Option<String>,
    pub restart_policy: Option<String>,
    pub memory_limit_mb: Option<u32>,
    pub cpu_limit: Option<f32>,
    pub runtime: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentVariable {
    pub key: String,
    pub value: String,
}

fn validate_token(value: &str, field: &str) -> Result<String> {
    let value = value.trim();
    if value.is_empty() || value.len() > 128 || value.chars().any(|c| c.is_control()) {
        return Err(CitadelError::Security(format!("Invalid {field}")));
    }
    Ok(value.to_string())
}

fn runtime_binary(runtime: Option<&str>) -> Result<(&'static str, String)> {
    let name = runtime.unwrap_or("docker");
    if name != "docker" && name != "podman" {
        return Err(CitadelError::Security("Container runtime must be docker or podman".into()));
    }
    let path = SafeCommandRunner::find_executable(name)
        .ok_or_else(|| CitadelError::Container(format!("{name} is not installed or unavailable")))?;
    Ok((name, path))
}

fn run_runtime(path: &str, args: &[String]) -> Result<String> {
    let refs: Vec<&str> = args.iter().map(String::as_str).collect();
    let (success, stdout, stderr) = SafeCommandRunner::run_with_timeout(path, &refs, COMMAND_TIMEOUT_MS)?;
    if !success {
        return Err(CitadelError::Container(if stderr.trim().is_empty() { stdout } else { stderr }));
    }
    Ok(stdout)
}

#[tauri::command]
pub async fn list_containers() -> CommandResult<Vec<ContainerSummary>> {
    Ok(crate::services::tool_discovery_service::ToolDiscoveryService::list_containers())
}

#[tauri::command]
pub async fn pull_container_image(image_tag: String, registry: Option<String>) -> Result<(), String> {
    let image = validate_token(&image_tag, "image tag").map_err(|e| e.to_string())?;
    let (runtime, path) = runtime_binary(None).map_err(|e| e.to_string())?;
    let registry = registry.unwrap_or_else(|| "docker.io".into());
    let registry = validate_token(&registry, "registry").map_err(|e| e.to_string())?;
    let image_ref = if image.contains('/') || registry == "docker.io" { image } else { format!("{registry}/{image}") };
    run_runtime(&path, &["pull".into(), image_ref]).map(|_| ()).map_err(|e| format!("{runtime}: {e}"))
}

#[tauri::command]
pub async fn run_container(config: RunContainerRequest) -> Result<ContainerSummary, String> {
    let name = validate_token(&config.name, "container name").map_err(|e| e.to_string())?;
    let image = validate_token(&config.image, "image").map_err(|e| e.to_string())?;
    let (runtime, path) = runtime_binary(config.runtime.as_deref()).map_err(|e| e.to_string())?;
    let mut args = vec!["run".into(), "-d".into(), "--name".into(), name.clone()];
    for port in config.ports {
        if port.host_port == 0 || port.container_port == 0 || !matches!(port.protocol.as_str(), "tcp" | "udp") {
            return Err("Invalid container port mapping".into());
        }
        args.extend(["-p".into(), format!("{}:{}/{}", port.host_port, port.container_port, port.protocol)]);
    }
    for variable in config.env_vars {
        let key = validate_token(&variable.key, "environment variable key").map_err(|e| e.to_string())?;
        if key.contains('=') || variable.value.chars().any(|c| c.is_control()) { return Err("Invalid environment variable".into()); }
        args.extend(["-e".into(), format!("{}={}", key, variable.value)]);
    }
    if let Some(policy) = config.restart_policy {
        if !matches!(policy.as_str(), "no" | "always" | "on-failure" | "unless-stopped") { return Err("Invalid restart policy".into()); }
        args.extend(["--restart".into(), policy]);
    }
    if let Some(memory) = config.memory_limit_mb { if memory == 0 || memory > 1_048_576 { return Err("Invalid memory limit".into()); } args.extend(["--memory".into(), format!("{memory}m")]); }
    if let Some(cpu) = config.cpu_limit { if !(cpu.is_finite() && cpu > 0.0 && cpu <= 256.0) { return Err("Invalid CPU limit".into()); } args.extend(["--cpus".into(), cpu.to_string()]); }
    args.push(image.clone());
    if let Some(command) = config.command { if command.len() > 4096 || command.chars().any(|c| c.is_control()) { return Err("Invalid container command".into()); } args.extend(["/bin/sh".into(), "-c".into(), command]); }
    let id = run_runtime(&path, &args).map_err(|e| format!("{runtime}: {e}"))?.trim().lines().next().unwrap_or_default().to_string();
    Ok(ContainerSummary { id: id.clone(), name, image, status: "running".into(), state: "running".into(), ports: vec![], runtime: runtime.into() })
}

#[tauri::command]
pub async fn container_action(container_id: String, action: String, runtime: Option<String>) -> Result<bool, String> {
    let id = validate_token(&container_id, "container id").map_err(|e| e.to_string())?;
    if !matches!(action.as_str(), "start" | "stop" | "restart" | "remove") { return Err("Unsupported container action".into()); }
    let (_, path) = runtime_binary(runtime.as_deref()).map_err(|e| e.to_string())?;
    run_runtime(&path, &[action, id]).map(|_| true).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn remove_container_image(image_id: String, runtime: Option<String>) -> Result<bool, String> {
    let id = validate_token(&image_id, "image id").map_err(|e| e.to_string())?;
    let (_, path) = runtime_binary(runtime.as_deref()).map_err(|e| e.to_string())?;
    run_runtime(&path, &["rmi".into(), id]).map(|_| true).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::validate_token;
    #[test]
    fn rejects_control_characters() { assert!(validate_token("bad\nvalue", "name").is_err()); }
    #[test]
    fn trims_safe_tokens() { assert_eq!(validate_token(" image:latest ", "image").unwrap(), "image:latest"); }
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
struct _ContainerCommandMarker;

#[allow(dead_code)]
fn _keep_model_import(_: ContainerSummary) {}
