import { normalizeCitadelError } from './errors';
import type {
  BootReport,
  DriveHealthReport,
  HostMetrics,
  SystemSnapshot,
  ToolchainSnapshot,
  ToolDefinition,
  WorkspaceStatus,
  ProjectRecord,
  NoteRecord,
  ContainerSummary,
  PythonEnvironmentInfo,
} from '../types';

/**
 * Diagnostic tracking for IPC telemetry & health monitoring
 */
export interface IpcTelemetry {
  isTauri: boolean;
  lastCallTimestamp: string | null;
  lastCallName: string | null;
  lastCallLatencyMs: number | null;
  lastError: string | null;
  totalCalls: number;
}

export const ipcTelemetry: IpcTelemetry = {
  isTauri: typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window),
  lastCallTimestamp: null,
  lastCallName: null,
  lastCallLatencyMs: null,
  lastError: null,
  totalCalls: 0,
};

/**
 * Returns whether running inside a real native Tauri 2.x desktop window
 */
export function isTauriEnvironment(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI__ || (window as any).__TAURI_INTERNALS__);
}

/**
 * Low-level typed invoke wrapper with timing and telemetry
 */
async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const start = performance.now();
  ipcTelemetry.totalCalls += 1;
  ipcTelemetry.lastCallName = command;

  try {
    if (isTauriEnvironment()) {
      // Dynamic import of Tauri core invoke
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<T>(command, args);
      const latency = Math.round(performance.now() - start);
      ipcTelemetry.lastCallLatencyMs = latency;
      ipcTelemetry.lastCallTimestamp = new Date().toISOString();
      return result;
    } else {
      // In browser preview / mock development mode
      return await mockWebFallback<T>(command, args);
    }
  } catch (err: any) {
    const norm = normalizeCitadelError(err);
    ipcTelemetry.lastError = norm.message;
    ipcTelemetry.lastCallTimestamp = new Date().toISOString();
    throw norm;
  }
}

/**
 * Fallback handler when running in browser mode (e.g. Vite dev preview)
 */
async function mockWebFallback<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  await new Promise((r) => setTimeout(r, 60)); // Fast micro-delay

  switch (command) {
    case 'get_boot_report':
    case 'start_boot_sequence':
    case 'retry_boot_checks': {
      const report: BootReport = {
        currentStage: 'controlPlaneReady',
        progressPercentage: 100,
        requiredChecksComplete: true,
        canEnterCommandCenter: true,
        timestamp: new Date().toISOString(),
        workspaceRoot: '/media/kali/CITADEL_DRIVE/Citadel/workspace',
        recoverableErrors: [],
        fatalErrors: [],
        checks: [
          {
            id: 'chk-host-os',
            name: 'Host Kernel & OS Profile',
            category: 'host',
            status: 'success',
            details: 'Linux 6.8.0-kali-amd64 (Web Sandbox)',
            durationMs: 4,
            isRequired: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'chk-storage-io',
            name: 'Storage IO & Permissions',
            category: 'storage',
            status: 'success',
            details: 'Local-first IndexedDB / Virtual FS (Ready)',
            durationMs: 6,
            isRequired: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'chk-db-sqlite',
            name: 'SQLite Metadata Vault',
            category: 'database',
            status: 'success',
            details: 'WAL active / Zero Corruption',
            durationMs: 12,
            isRequired: true,
            timestamp: new Date().toISOString(),
          },
          {
            id: 'chk-toolchain',
            name: 'Developer & Security Toolchain',
            category: 'toolchain',
            status: 'success',
            details: 'Git: OK, Python: OK, Containers: Ready',
            durationMs: 8,
            isRequired: false,
            timestamp: new Date().toISOString(),
          },
        ],
        driveHealth: {
          deviceName: '/dev/sdb1 (Portable USB)',
          mountPoint: '/media/kali/CITADEL_DRIVE/Citadel/workspace',
          filesystem: 'ext4',
          isRemovable: true,
          isReadOnly: false,
          totalBytes: 32 * 1024 * 1024 * 1024,
          usedBytes: 8.8 * 1024 * 1024 * 1024,
          freeBytes: 23.2 * 1024 * 1024 * 1024,
          usagePercentage: 28,
          estimatedWearLevel: 98,
          safeToEject: true,
          unmountPending: false,
          lastSyncTimestamp: new Date().toISOString(),
        },
        toolchain: {
          git: { installed: true, executable: '/usr/bin/git', version: 'git version 2.45.2', error: null },
          docker: { installed: true, executable: '/usr/bin/docker', version: 'Docker 26.1.4', error: null },
          podman: { installed: false, executable: null, version: null, error: 'Not installed' },
          python: { installed: true, executable: '/usr/bin/python3', version: 'Python 3.12.3', error: null },
          node: { installed: true, executable: '/usr/bin/node', version: 'v20.14.0', error: null },
          rustc: { installed: true, executable: '/usr/bin/rustc', version: 'rustc 1.78.0', error: null },
          cargo: { installed: true, executable: '/usr/bin/cargo', version: 'cargo 1.78.0', error: null },
          shell: { installed: true, executable: '/bin/zsh', version: 'ZSH (Kali Default)', error: null },
        },
      };
      return report as unknown as T;
    }

    case 'get_system_snapshot': {
      const snap: SystemSnapshot = {
        hostname: 'kali-citadel-node',
        osName: 'Kali GNU/Linux Rolling',
        osId: 'kali',
        kernelVersion: '6.8.0-kali-amd64',
        isKaliLinux: true,
        cpuUsagePercent: 14.5,
        cpuCoreCount: 8,
        memoryUsedBytes: 5.4 * 1024 * 1024 * 1024,
        memoryTotalBytes: 16 * 1024 * 1024 * 1024,
        swapUsedBytes: 0.2 * 1024 * 1024 * 1024,
        swapTotalBytes: 4 * 1024 * 1024 * 1024,
        uptimeSeconds: 14820,
        processCount: 184,
        topProcesses: [
          { pid: 1420, name: 'citadel', cpuUsage: 2.1, memoryBytes: 148 * 1024 * 1024, status: 'Run', user: 'kali' },
          { pid: 980, name: 'dockerd', cpuUsage: 0.8, memoryBytes: 94 * 1024 * 1024, status: 'Sleep', user: 'root' },
          { pid: 2104, name: 'xterm', cpuUsage: 0.4, memoryBytes: 42 * 1024 * 1024, status: 'Sleep', user: 'kali' },
        ],
        disks: [
          {
            name: '/dev/sdb1',
            mountPoint: '/media/kali/CITADEL_DRIVE',
            filesystem: 'ext4',
            totalBytes: 32 * 1024 * 1024 * 1024,
            availableBytes: 23.2 * 1024 * 1024 * 1024,
            isRemovable: true,
            isReadOnly: false,
          },
        ],
        networkInterfaces: [
          { name: 'eth0', receivedBytes: 8492040, transmittedBytes: 2490204, isUp: true },
          { name: 'wlan0', receivedBytes: 0, transmittedBytes: 0, isUp: false },
        ],
        collectedAt: new Date().toISOString(),
      };
      return snap as unknown as T;
    }

    case 'get_workspace_status': {
      const status: WorkspaceStatus = {
        rootPath: '/media/kali/CITADEL_DRIVE/Citadel/workspace',
        exists: true,
        isWritable: true,
        isRemovableDrive: true,
        hasStaleLock: false,
        totalSpaceBytes: 32 * 1024 * 1024 * 1024,
        freeSpaceBytes: 23.2 * 1024 * 1024 * 1024,
        projectCount: 4,
        noteCount: 12,
        databaseIntegrityOk: true,
        lastCheckedAt: new Date().toISOString(),
      };
      return status as unknown as T;
    }

    case 'prepare_safe_eject': {
      return 'Flushed SQLite WAL buffers. Storage safe to unmount.' as unknown as T;
    }

    default:
      return true as unknown as T;
  }
}

// ----------------------------------------------------------------------------
// STRONGLY TYPED COMMAND API
// ----------------------------------------------------------------------------

export async function getBootReport(): Promise<BootReport> {
  return invokeTauri<BootReport>('get_boot_report');
}

export async function startBootChecks(): Promise<BootReport> {
  return invokeTauri<BootReport>('start_boot_sequence');
}

export async function retryBootChecks(): Promise<BootReport> {
  return invokeTauri<BootReport>('retry_boot_checks');
}

export async function completeLaunchSequence(): Promise<boolean> {
  return invokeTauri<boolean>('complete_launch_sequence');
}

export async function getSystemSnapshot(): Promise<SystemSnapshot> {
  return invokeTauri<SystemSnapshot>('get_system_snapshot');
}

export async function getDriveHealth(): Promise<DriveHealthReport> {
  return invokeTauri<DriveHealthReport>('get_drive_health');
}

export async function getWorkspaceStatus(): Promise<WorkspaceStatus> {
  return invokeTauri<WorkspaceStatus>('get_workspace_status');
}

export async function discoverToolchain(): Promise<ToolchainSnapshot> {
  return invokeTauri<ToolchainSnapshot>('discover_toolchain');
}

export async function scanToolRegistry(): Promise<ToolDefinition[]> {
  return invokeTauri<ToolDefinition[]>('scan_tool_registry');
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return invokeTauri<ProjectRecord[]>('list_projects');
}

export async function createProject(project: ProjectRecord): Promise<boolean> {
  return invokeTauri<boolean>('create_project', { project });
}

export async function listContainers(): Promise<ContainerSummary[]> {
  return invokeTauri<ContainerSummary[]>('list_containers');
}

export async function getGitStatus(projectPath?: string): Promise<string> {
  return invokeTauri<string>('get_git_status', { projectPath });
}

export async function getPythonEnvironments(): Promise<PythonEnvironmentInfo[]> {
  return invokeTauri<PythonEnvironmentInfo[]>('get_python_environments');
}

export async function listNotes(): Promise<NoteRecord[]> {
  return invokeTauri<NoteRecord[]>('list_notes');
}

export async function readNote(noteId: string): Promise<string> {
  return invokeTauri<string>('read_note', { noteId });
}

export async function writeNote(note: NoteRecord): Promise<boolean> {
  return invokeTauri<boolean>('write_note', { note });
}

export async function prepareSafeEject(): Promise<string> {
  return invokeTauri<string>('prepare_safe_eject');
}

export async function recoverStaleWorkspaceLock(): Promise<boolean> {
  return invokeTauri<boolean>('recover_stale_workspace_lock');
}

export async function selectWorkspaceRoot(newPath: string): Promise<BootReport> {
  return invokeTauri<BootReport>('select_workspace_root', { newPath });
}

export async function createTerminalSession(id: string, cols: number, rows: number): Promise<boolean> {
  return invokeTauri<boolean>('create_terminal_session', { id, cols, rows });
}

export async function writeTerminalInput(id: string, input: string): Promise<boolean> {
  return invokeTauri<boolean>('write_terminal_input', { id, input });
}

export async function resizeTerminal(id: string, cols: number, rows: number): Promise<boolean> {
  return invokeTauri<boolean>('resize_terminal', { id, cols, rows });
}

export async function closeTerminal(id: string): Promise<boolean> {
  return invokeTauri<boolean>('close_terminal', { id });
}
