import { VirtualFile } from '../types';

export const detectLanguageByPath = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    rs: 'rust',
    py: 'python',
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    json: 'json',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    md: 'markdown',
    toml: 'toml',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    hpp: 'cpp',
    html: 'html',
    css: 'css',
    xml: 'xml',
    ini: 'ini',
    conf: 'ini',
  };
  return langMap[ext] || 'plaintext';
};

export const DEFAULT_WORKSPACE_FILES: Record<string, VirtualFile> = {
  'src/main.rs': {
    path: 'src/main.rs',
    name: 'main.rs',
    language: 'rust',
    status: 'modified',
    isModified: true,
    sizeBytes: 1540,
    lastModifiedAt: '2026-09-03T03:10:00Z',
    content: `// Citadel Enclave Network Diagnostic Engine
// Target: High-throughput subnet scanner & banner grabber

use std::net::{IpAddr, SocketAddr, TcpStream};
use std::time::Duration;
use tokio::task;

#[derive(Debug, Clone)]
pub struct ScanTarget {
    pub ip: IpAddr,
    pub ports: Vec<u16>,
    pub timeout_ms: u64,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("[CITADEL-ENGINE] Initializing async enclave scanner v2.4.0...");
    let target = ScanTarget {
        ip: "10.0.4.15".parse()?,
        ports: vec![22, 80, 443, 3306, 5432, 8080],
        timeout_ms: 1200,
    };

    println!("[+] Scanning subnet target: {} (ports: {:?})", target.ip, target.ports);
    let mut handles = vec![];

    for port in target.ports {
        let ip = target.ip;
        handles.push(task::spawn(async move {
            let addr = SocketAddr::new(ip, port);
            match TcpStream::connect_timeout(&addr, Duration::from_millis(800)) {
                Ok(_) => println!("  [OPEN] {}:{} verified active", ip, port),
                Err(_) => println!("  [CLOSED] {}:{}", ip, port),
            }
        }));
    }

    for handle in handles {
        let _ = handle.await;
    }

    println!("[✓] Scan complete. Telemetry recorded in SQLite WAL vault.");
    Ok(())
}
`,
    diff: {
      added: [
        '+ let target = ScanTarget {',
        '+     ip: "10.0.4.15".parse()?,',
        '+     ports: vec![22, 80, 443, 3306, 5432, 8080],',
        '+     timeout_ms: 1200,',
        '+ };',
      ],
      removed: ['- let target = "127.0.0.1:8080";'],
      unified: `@@ -12,4 +12,8 @@
- let target = "127.0.0.1:8080";
+ let target = ScanTarget {
+     ip: "10.0.4.15".parse()?,
+     ports: vec![22, 80, 443, 3306, 5432, 8080],
+     timeout_ms: 1200,
+ };`,
    },
  },
  'src/scanner.py': {
    path: 'src/scanner.py',
    name: 'scanner.py',
    language: 'python',
    status: 'clean',
    isModified: false,
    sizeBytes: 1120,
    lastModifiedAt: '2026-09-02T18:40:00Z',
    content: `#!/usr/bin/env python3
"""
Citadel Security Assessment Script
Author: kali@citadel-enclave
"""

import sys
import socket
import json
from datetime import datetime

def probe_service_banner(host: str, port: int, timeout: float = 1.5) -> dict:
    result = {
        "host": host,
        "port": port,
        "state": "closed",
        "banner": None,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout)
    
    try:
        sock.connect((host, port))
        result["state"] = "open"
        try:
            # Send generic probe
            sock.sendall(b"HEAD / HTTP/1.0\\r\\n\\r\\n")
            banner = sock.recv(1024)
            result["banner"] = banner.decode("utf-8", errors="ignore").strip()
        except Exception:
            pass
    except Exception:
        result["state"] = "filtered"
    finally:
        sock.close()
        
    return result

if __name__ == "__main__":
    target_host = "10.0.4.15"
    ports = [22, 80, 443, 5432]
    print(f"[*] Probing {target_host} across {len(ports)} target ports...")
    
    for p in ports:
        res = probe_service_banner(target_host, p)
        print(f"  -> Port {p}: {res['state'].upper()} (Banner: {res['banner'][:40] if res['banner'] else 'N/A'})")
`,
  },
  'configs/audit_rules.json': {
    path: 'configs/audit_rules.json',
    name: 'audit_rules.json',
    language: 'json',
    status: 'modified',
    isModified: true,
    sizeBytes: 420,
    lastModifiedAt: '2026-09-03T01:20:00Z',
    content: `{
  "$schema": "https://citadel.local/schemas/audit-v2.json",
  "assessmentId": "AEGIS-2026-Q3",
  "scope": {
    "subnets": ["10.0.4.0/24"],
    "excludedIps": ["10.0.4.1", "10.0.4.254"],
    "authorizedTechniques": [
      "SYN_STEALTH_SCAN",
      "SERVICE_VERSION_DETECTION",
      "TLS_CIPHERSUITE_ENUMERATION"
    ]
  },
  "maxConcurrentThreads": 16,
  "safeEjectAutoFlush": true,
  "telemetryIsolation": "STRICT_LOCAL_AIRGAP"
}
`,
    diff: {
      added: [
        '+     "TLS_CIPHERSUITE_ENUMERATION"',
        '+   ],',
        '+   "maxConcurrentThreads": 16,',
      ],
      removed: ['-     "TLS_CIPHERSUITE_ENUMERATION"', '-   ]'],
      unified: `@@ -8,3 +8,4 @@
-     "TLS_CIPHERSUITE_ENUMERATION"
-   ]
+     "TLS_CIPHERSUITE_ENUMERATION"
+   ],
+   "maxConcurrentThreads": 16,`,
    },
  },
  'Cargo.toml': {
    path: 'Cargo.toml',
    name: 'Cargo.toml',
    language: 'toml',
    status: 'clean',
    isModified: false,
    sizeBytes: 310,
    lastModifiedAt: '2026-08-30T10:15:00Z',
    content: `[package]
name = "citadel-aegis-scanner"
version = "2.4.0"
edition = "2021"
authors = ["kali@citadel-enclave"]

[dependencies]
tokio = { version = "1.38", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
rusqlite = { version = "0.31", features = ["bundled"] }
colored = "2.1"
`,
  },
  'tests/test_audit.py': {
    path: 'tests/test_audit.py',
    name: 'test_audit.py',
    language: 'python',
    status: 'clean',
    isModified: false,
    sizeBytes: 250,
    lastModifiedAt: '2026-09-01T12:00:00Z',
    content: `import pytest
from src.scanner import probe_service_banner

def test_closed_port():
    res = probe_service_banner("127.0.0.1", 65432, timeout=0.1)
    assert res["state"] in ["closed", "filtered"]

def test_scope_structure():
    assert True
`,
  },
  'README.md': {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    status: 'clean',
    isModified: false,
    sizeBytes: 520,
    lastModifiedAt: '2026-08-25T09:00:00Z',
    content: `# Aegis Audit 2026 // Security Assessment Enclave

Authorized security assessment codebase stored in portable flash storage under Citadel.

## Structure
- \`src/main.rs\` - High-performance async Rust probe scanner
- \`src/scanner.py\` - Python auxiliary banner inspection tool
- \`configs/audit_rules.json\` - Scoped targets and authorized engagement parameters
- \`tests/\` - Automated regression test suite

## Quick Execution
- **Run Rust Engine:** \`cargo run --release\`
- **Run Python Probe:** \`python3 src/scanner.py\`
- **Run Test Suite:** \`pytest tests/\`
`,
  },
};
