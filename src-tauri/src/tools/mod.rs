use serde::{Deserialize, Serialize};
use crate::errors::{CitadelError, Result};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SafeLaunchTemplate {
    pub name: String,
    pub description: String,
    pub args_template: String,
    pub requires_elevation: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

pub struct ToolRegistry;

impl ToolRegistry {
    /// Allowlist of supported Kali Linux and DevOps utilities
    pub fn get_allowlisted_tools() -> Vec<ToolDefinition> {
        vec![
            ToolDefinition {
                id: "tool-nmap".into(),
                name: "Nmap (Network Mapper)".into(),
                binary_name: "nmap".into(),
                category: "Network Diagnostics".into(),
                description: "Security scanner for network exploration and port auditing.".into(),
                installed: Self::is_binary_installed("nmap"),
                binary_path: Some("/usr/bin/nmap".into()),
                version: Some("7.94SVN".into()),
                required_permission: "Raw Socket / Net Admin".into(),
                help_command: "nmap --help".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        name: "Safe Ping & Fast Scan (Top 100 ports)".into(),
                        description: "Rapid, low-impact check on targeted authorized host without intrusive scripts.".into(),
                        args_template: "-sT -F -T3 {target}".into(),
                        requires_elevation: false,
                    }
                ],
                doc_url: "https://nmap.org/book/man.html".into(),
            },
            ToolDefinition {
                id: "tool-wireshark".into(),
                name: "Tshark / Wireshark CLI".into(),
                binary_name: "tshark".into(),
                category: "Network Diagnostics".into(),
                description: "Terminal-based packet capture capture engine.".into(),
                installed: Self::is_binary_installed("tshark"),
                binary_path: Some("/usr/bin/tshark".into()),
                version: Some("4.2.2".into()),
                required_permission: "Raw Socket / Net Admin".into(),
                help_command: "tshark -h".into(),
                safe_launch_templates: vec![
                    SafeLaunchTemplate {
                        name: "Capture 50 Packets".into(),
                        description: "Capture 50 packets on default interface with summary info.".into(),
                        args_template: "-i any -c 50".into(),
                        requires_elevation: true,
                    }
                ],
                doc_url: "https://www.wireshark.org/docs/man-pages/tshark.html".into(),
            },
        ]
    }

    /// Validates whether a given binary exists in PATH
    pub fn is_binary_installed(name: &str) -> bool {
        Command::new("which")
            .arg(name)
            .output()
            .map(|out| out.status.success())
            .unwrap_or(false)
    }
}
