use std::path::Path;
use crate::models::tools::{Availability, ContainerSummary, PythonEnvironmentInfo, SafeLaunchTemplate, ToolDefinition, ToolchainSnapshot};
use crate::utils::command_runner::SafeCommandRunner;

pub struct ToolDiscoveryService;

impl ToolDiscoveryService {
    /// Discovers toolchain status
    pub fn get_toolchain_snapshot() -> ToolchainSnapshot {
        ToolchainSnapshot {
            git: Self::check_tool("git", &["--version"]),
            docker: Self::check_tool("docker", &["--version"]),
            podman: Self::check_tool("podman", &["--version"]),
            python: Self::check_tool("python3", &["--version"]),
            node: Self::check_tool("node", &["--version"]),
            rustc: Self::check_tool("rustc", &["--version"]),
            cargo: Self::check_tool("cargo", &["--version"]),
            shell: Self::check_shell(),
        }
    }

    /// Checks a specific binary with safe arguments and bounded timeout
    pub fn check_tool(binary_name: &str, version_args: &[&str]) -> Availability {
        if let Some(exe_path) = SafeCommandRunner::find_executable(binary_name) {
            match SafeCommandRunner::run_with_timeout(&exe_path, version_args, 2000) {
                Ok((success, stdout, stderr)) => {
                    let raw_version = if !stdout.trim().is_empty() { stdout } else { stderr };
                    let first_line = raw_version.lines().next().unwrap_or("").trim().to_string();
                    Availability {
                        installed: success,
                        executable: Some(exe_path),
                        version: if success && !first_line.is_empty() { Some(first_line) } else { None },
                        error: if !success { Some("Executable returned non-zero code".into()) } else { None },
                    }
                }
                Err(err) => Availability {
                    installed: true,
                    executable: Some(exe_path),
                    version: None,
                    error: Some(err.to_string()),
                },
            }
        } else {
            Availability {
                installed: false,
                executable: None,
                version: None,
                error: Some(format!("'{}' not found in system $PATH", binary_name)),
            }
        }
    }

    fn check_shell() -> Availability {
        let shell_path = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".into());
        let exists = Path::new(&shell_path).exists();
        Availability {
            installed: exists,
            executable: Some(shell_path.clone()),
            version: Some(if shell_path.contains("zsh") {
                "ZSH (Kali Default)".into()
            } else if shell_path.contains("bash") {
                "GNU Bash".into()
            } else {
                "POSIX Shell".into()
            }),
            error: None,
        }
    }

    /// Discovers containers via docker or podman CLI
    pub fn list_containers() -> Vec<ContainerSummary> {
        let mut containers = Vec::new();

        // 1. Docker check
        if let Some(docker_path) = SafeCommandRunner::find_executable("docker") {
            if let Ok((true, stdout, _)) = SafeCommandRunner::run_with_timeout(
                &docker_path,
                &["ps", "-a", "--format", "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}"],
                2500,
            ) {
                for line in stdout.lines() {
                    let parts: Vec<&str> = line.split('|').collect();
                    if parts.len() >= 5 {
                        let ports: Vec<String> = parts.get(5).unwrap_or(&"")
                            .split(',')
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty())
                            .collect();

                        containers.push(ContainerSummary {
                            id: parts[0].to_string(),
                            name: parts[1].to_string(),
                            image: parts[2].to_string(),
                            status: parts[3].to_string(),
                            state: parts[4].to_string(),
                            ports,
                            runtime: "docker".into(),
                        });
                    }
                }
            }
        }

        // 2. Podman check
        if let Some(podman_path) = SafeCommandRunner::find_executable("podman") {
            if let Ok((true, stdout, _)) = SafeCommandRunner::run_with_timeout(
                &podman_path,
                &["ps", "-a", "--format", "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}"],
                2500,
            ) {
                for line in stdout.lines() {
                    let parts: Vec<&str> = line.split('|').collect();
                    if parts.len() >= 5 {
                        let ports: Vec<String> = parts.get(5).unwrap_or(&"")
                            .split(',')
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty())
                            .collect();

                        containers.push(ContainerSummary {
                            id: parts[0].to_string(),
                            name: parts[1].to_string(),
                            image: parts[2].to_string(),
                            status: parts[3].to_string(),
                            state: parts[4].to_string(),
                            ports,
                            runtime: "podman".into(),
                        });
                    }
                }
            }
        }

        containers
    }

    /// Discovers Python environments in host & workspace
    pub fn list_python_environments(workspace_path: &Path) -> Vec<PythonEnvironmentInfo> {
        let mut envs = Vec::new();

        // System Python
        if let Some(sys_py) = SafeCommandRunner::find_executable("python3") {
            let ver = SafeCommandRunner::run_with_timeout(&sys_py, &["--version"], 1500)
                .map(|(_, out, _)| out.trim().to_string())
                .unwrap_or_else(|_| "Python 3".into());

            envs.push(PythonEnvironmentInfo {
                executable_path: sys_py,
                version: ver,
                is_virtualenv: false,
                pip_packages: vec![],
            });
        }

        // Workspace virtual environments (.venv, venv, env)
        let possible_venvs = [".venv/bin/python", "venv/bin/python", "env/bin/python"];
        for rel in &possible_venvs {
            let venv_py = workspace_path.join(rel);
            if venv_py.exists() {
                let ver = SafeCommandRunner::run_with_timeout(
                    &venv_py.to_string_lossy(),
                    &["--version"],
                    1500,
                )
                .map(|(_, out, _)| out.trim().to_string())
                .unwrap_or_else(|_| "Virtualenv Python".into());

                envs.push(PythonEnvironmentInfo {
                    executable_path: venv_py.to_string_lossy().to_string(),
                    version: ver,
                    is_virtualenv: true,
                    pip_packages: vec![],
                });
            }
        }

        envs
    }

    /// Allowlisted tools registry with security metadata
    pub fn get_allowlisted_tools() -> Vec<ToolDefinition> {
        vec![
            ToolDefinition {
                id: "tool-nmap".into(),
                name: "Nmap Network Auditor".into(),
                binary_name: "nmap".into(),
                category: "Network Diagnostics".into(),
                description: "Security scanner for network exploration and port auditing.".into(),
                installed: SafeCommandRunner::find_executable("nmap").is_some(),
                binary_path: SafeCommandRunner::find_executable("nmap"),
                version: Some("Kali Standard".into()),
                required_permission: "CAP_NET_RAW / User Socket".into(),
                help_command: "nmap --help".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        id: "tmpl-nmap-fast".into(),
                        name: "Fast Non-Intrusive Discovery (Top 100 Ports)".into(),
                        description: "Standard TCP connect scan without intrusive vulnerability scripts.".into(),
                        args_template: "-sT -F -T3 {target}".into(),
                        requires_elevation: false,
                    },
                    SafeLaunchTemplate {
                        id: "tmpl-nmap-service".into(),
                        name: "Service & Version Banner Probe".into(),
                        description: "Detects software versions listening on open ports.".into(),
                        args_template: "-sV -T3 {target}".into(),
                        requires_elevation: false,
                    },
                ],
                doc_url: "https://nmap.org/docs.html".into(),
            },
            ToolDefinition {
                id: "tool-tshark".into(),
                name: "Tshark / Wireshark Engine".into(),
                binary_name: "tshark".into(),
                category: "Network Diagnostics".into(),
                description: "CLI packet analyzer for forensic dump inspection.".into(),
                installed: SafeCommandRunner::find_executable("tshark").is_some(),
                binary_path: SafeCommandRunner::find_executable("tshark"),
                version: Some("4.x".into()),
                required_permission: "CAP_NET_RAW".into(),
                help_command: "tshark -h".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        id: "tmpl-tshark-count".into(),
                        name: "Sample 50 Local Packets".into(),
                        description: "Captures bounded batch of 50 packets on default interface.".into(),
                        args_template: "-i any -c 50".into(),
                        requires_elevation: true,
                    },
                ],
                doc_url: "https://www.wireshark.org/docs/man-pages/tshark.html".into(),
            },
            ToolDefinition {
                id: "tool-git".into(),
                name: "Git Version Control".into(),
                binary_name: "git".into(),
                category: "Development & DevOps".into(),
                description: "Distributed version control system for local projects.".into(),
                installed: SafeCommandRunner::find_executable("git").is_some(),
                binary_path: SafeCommandRunner::find_executable("git"),
                version: Some("2.x".into()),
                required_permission: "Standard User".into(),
                help_command: "git --help".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        id: "tmpl-git-status".into(),
                        name: "Inspect Repository Status".into(),
                        description: "Inspects clean, staged, and untracked changes.".into(),
                        args_template: "status -s".into(),
                        requires_elevation: false,
                    },
                ],
                doc_url: "https://git-scm.com/doc".into(),
            },
            ToolDefinition {
                id: "tool-docker".into(),
                name: "Docker Container Engine".into(),
                binary_name: "docker".into(),
                category: "Containers & Sandboxes".into(),
                description: "Container isolation runtime for reproducible environments.".into(),
                installed: SafeCommandRunner::find_executable("docker").is_some(),
                binary_path: SafeCommandRunner::find_executable("docker"),
                version: Some("CE Engine".into()),
                required_permission: "Docker Group / Socket".into(),
                help_command: "docker --help".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        id: "tmpl-docker-ps".into(),
                        name: "List Active Sandboxes".into(),
                        description: "Lists running container instances.".into(),
                        args_template: "ps".into(),
                        requires_elevation: false,
                    },
                ],
                doc_url: "https://docs.docker.com/".into(),
            },
            ToolDefinition {
                id: "tool-rustc".into(),
                name: "Rust Compiler (rustc & cargo)".into(),
                binary_name: "cargo".into(),
                category: "Development & DevOps".into(),
                description: "Memory-safe systems programming build engine.".into(),
                installed: SafeCommandRunner::find_executable("cargo").is_some(),
                binary_path: SafeCommandRunner::find_executable("cargo"),
                version: Some("Stable".into()),
                required_permission: "Standard User".into(),
                help_command: "cargo --help".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        id: "tmpl-cargo-check".into(),
                        name: "Check Build Syntax".into(),
                        description: "Analyzes project for compilation and type errors.".into(),
                        args_template: "check".into(),
                        requires_elevation: false,
                    },
                ],
                doc_url: "https://doc.rust-lang.org/cargo/".into(),
            },
        ]
    }
}
