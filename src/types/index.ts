/**
 * Citadel Core Types & Data Models
 * Mirrored with Rust backend Serde types in src-tauri/src/models/
 */

export * from './boot';
export * from './workflows';
export * from './workspace';

export type DataState =
  | 'loading'
  | 'live'
  | 'stale'
  | 'unavailable'
  | 'warning'
  | 'error';

export interface DataMeta {
  state: DataState;
  source: string;
  collectedAt: string | null;
  error?: string;
}

export type ModuleId =
  | 'command-center'
  | 'workspace'
  | 'terminal-deck'
  | 'toolbox'
  | 'devops-bay'
  | 'code-lab'
  | 'data-lab'
  | 'system-monitor'
  | 'notes-runbooks'
  | 'settings';

export type ProjectCategory = 'Security' | 'DevOps' | 'Software' | 'Data Science' | 'Research' | 'General';

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string;
  category: string;
  path: string;
  repositoryUrl?: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  preferredShell?: string;
  preferredShellProfile?: string;
  notesSummary?: string;
  gitBranch?: string;
  hasVirtualEnv?: boolean;
  createdAt: string;
  lastOpenedAt: string;
}

export type Project = ProjectRecord;

export interface WorkspaceStatus {
  rootPath: string;
  exists?: boolean;
  isMounted?: boolean;
  isWritable: boolean;
  isReadOnly?: boolean;
  isRemovableDrive?: boolean;
  hasStaleLock?: boolean;
  lockActive?: boolean;
  lockOwnerPid?: number;
  lockTimestamp?: string;
  structureValid?: boolean;
  totalSpaceBytes?: number;
  freeSpaceBytes?: number;
  totalProjects?: number;
  projectCount?: number;
  noteCount?: number;
  activeProject?: ProjectRecord | null;
  databaseIntegrityOk?: boolean;
  directories?: {
    projects: string;
    notes: string;
    datasets: string;
    toolProfiles: string;
    logs: string;
    backups: string;
    cache: string;
    config: string;
  };
  lastCheckedAt?: string;
}

export interface DriveHealthReport {
  deviceName: string;
  mountPoint: string;
  filesystem: string;
  isRemovable: boolean;
  isReadOnly: boolean;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercentage: number;
  estimatedWearLevel: number;
  safeToEject: boolean;
  unmountPending: boolean;
  ioReadBytesSec?: number;
  ioWriteBytesSec?: number;
  lastSyncTimestamp: string;
}

export type DriveHealth = DriveHealthReport;

export interface ProcessSummary {
  pid: number;
  name: string;
  cpuUsage: number;
  memoryBytes: number;
  status: string;
  user?: string;
}

export interface DiskInfo {
  name: string;
  mountPoint: string;
  filesystem: string;
  totalBytes: number;
  availableBytes: number;
  isRemovable: boolean;
  isReadOnly: boolean;
}

export interface NetworkInterfaceInfo {
  name: string;
  receivedBytes?: number;
  transmittedBytes?: number;
  rxBytesSec?: number;
  txBytesSec?: number;
  isUp: boolean;
  ipAddresses?: string[];
  macAddress?: string;
  isVpnOrTunnel?: boolean;
}

export interface CpuCoreMetrics {
  coreId: number;
  usagePercent: number;
  frequencyMhz: number;
}

export interface SystemSnapshot {
  hostname: string;
  osName: string;
  osVersion?: string;
  osId?: string;
  kernelVersion?: string;
  isKaliLinux: boolean;
  cpuModel?: string;
  cpuUsagePercent: number;
  cpuCoreCount?: number;
  cpuCores?: CpuCoreMetrics[];
  memoryUsedBytes?: number;
  memoryTotalBytes?: number;
  totalRamBytes?: number;
  usedRamBytes?: number;
  freeRamBytes?: number;
  cachedRamBytes?: number;
  swapUsedBytes?: number;
  swapTotalBytes?: number;
  uptimeSeconds: number;
  processCount?: number;
  activeProcessesCount?: number;
  topProcesses?: ProcessSummary[];
  disks?: DiskInfo[];
  networkInterfaces: NetworkInterfaceInfo[];
  batteryPercent?: number;
  batteryCharging?: boolean;
  collectedAt?: string;
  timestamp?: string;
}

export type HostMetrics = SystemSnapshot;
export type SystemMetrics = SystemSnapshot;

export interface Availability {
  installed: boolean;
  executable?: string | null;
  version?: string | null;
  error?: string | null;
}

export interface ToolchainSnapshot {
  git: Availability;
  docker: Availability;
  podman: Availability;
  python: Availability;
  node: Availability;
  rustc: Availability;
  cargo: Availability;
  shell: Availability;
}

export type ToolCategory =
  | 'Network Diagnostics'
  | 'Web Testing'
  | 'Forensics & Analysis'
  | 'Wireless Diagnostics'
  | 'Password Auditing (Authorized)'
  | 'Development & Binaries'
  | 'Containers & Infrastructure'
  | 'Data Science & CLI';

export type RequiredPermission = 'Standard User' | 'Requires Sudo / Root' | 'Raw Socket / Net Admin' | 'Docker Daemon' | string;

export interface SafeLaunchTemplate {
  id?: string;
  name: string;
  description: string;
  argsTemplate: string;
  requiresElevation: boolean;
}

export interface ToolOption {
  flag: string;
  label: string;
  description: string;
  type: 'boolean' | 'string' | 'number';
  defaultValue?: any;
  placeholder?: string;
  required?: boolean;
}

export interface ToolDefinition {
  id: string;
  name: string;
  binaryName: string;
  category: ToolCategory | string;
  description: string;
  installed: boolean;
  isAvailable?: boolean;
  isCustom?: boolean;
  binaryPath?: string;
  version?: string;
  requiredPermission: RequiredPermission;
  helpCommand: string;
  safeLaunchTemplates: SafeLaunchTemplate[];
  options?: ToolOption[];
  docUrl: string;
  lastRunTimestamp?: string;
}

export interface ToolExecutionRequest {
  toolId: string;
  commandString: string;
  args?: string[];
  workingDirectory: string;
  runInTerminal?: boolean;
  requiresElevation?: boolean;
  targetDescription?: string;
  userConfirmationGranted: boolean;
  scopeAuthorizationAcknowledged: boolean;
}

export interface ToolExecutionResult {
  executionId: string;
  toolId: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timestamp: string;
  wasCancelled: boolean;
}

export interface ContainerPortMapping {
  hostPort: number;
  containerPort: number;
  protocol: string;
}

export interface ContainerSummary {
  id: string;
  name: string;
  image: string;
  status: string;
  state?: string;
  statusText?: string;
  created?: string;
  ports: (string | ContainerPortMapping)[];
  runtime?: string; // 'docker' | 'podman'
  cpuUsagePercent?: number;
  memoryUsageMb?: number;
  command?: string;
  env?: Record<string, string>;
  isCustom?: boolean;
}

export interface ContainerImageInfo {
  id: string;
  repository: string;
  tag: string;
  sizeMb: number;
  created: string;
  digest?: string;
  isCustom?: boolean;
  description?: string;
}

export interface RunContainerConfig {
  name: string;
  image: string;
  ports: { hostPort: number; containerPort: number; protocol?: string }[];
  envVars?: { key: string; value: string }[];
  command?: string;
  restartPolicy?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  memoryLimitMb?: number;
  cpuLimit?: number;
  runtime?: 'docker' | 'podman';
}

export interface PythonPackageInfo {
  name: string;
  version: string;
}

export interface PythonEnvironmentInfo {
  id?: string;
  name?: string;
  type?: 'uv' | 'venv' | 'system' | 'conda';
  executablePath: string;
  version: string;
  isActive?: boolean;
  isVirtualenv?: boolean;
  jupyterAvailable?: boolean;
  jupyterRunning?: boolean;
  packages?: PythonPackageInfo[];
  pipPackages?: string[];
}

export type PythonEnvironment = PythonEnvironmentInfo;

export interface DataPreviewResult {
  fileName: string;
  fileSizeBytes: number;
  fileType: string;
  totalRowsEstimate: number;
  columns: string[];
  rows: Record<string, any>[];
  isTruncated: boolean;
  readDurationMs: number;
}

export type TerminalProfile = 'Kali Shell' | 'Container Shell' | 'Project Shell' | 'Python Environment' | string;

export interface CreateTerminalRequest {
  id: string;
  profile?: TerminalProfile;
  workingDirectory?: string;
  cols?: number;
  rows?: number;
}

export interface TerminalSessionInfo {
  sessionId: string;
  pid: number;
  shell: string;
  workingDirectory: string;
  isElevated: boolean;
  startedAt: string;
}

export interface TerminalSession {
  id: string;
  title: string;
  profile: TerminalProfile;
  workingDirectory: string;
  activePid: number;
  isElevated: boolean;
  status: 'running' | 'stopped' | 'errored';
  createdAt: string;
}

export interface GitFileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked';
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  date: string;
  message: string;
  isHead: boolean;
}

export interface GitRepositoryStatus {
  isGitRepo: boolean;
  currentBranch: string;
  branches: string[];
  remoteUrl: string;
  ahead: number;
  behind: number;
  hasUncommittedChanges: boolean;
  files: GitFileChange[];
  recentCommits: GitCommit[];
  readmeContent: string;
}

export interface LaunchedProcess {
  pid: number;
  title: string;
  command: string;
  startedAt: string;
  cpuPercent: number;
  memoryMb: number;
  status: 'running' | 'sleeping' | 'stopped';
}

export interface NoteRecord {
  id: string;
  title: string;
  content: string;
  tags: string[];
  projectId?: string;
  templateType?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Note = NoteRecord;

export interface AuditEntry {
  id: string;
  timestamp: string;
  actionType: string;
  details: string;
  target?: string;
  executedBy: string;
  exitCode?: number;
  durationMs?: number;
  severity: string;
}

export interface MissionTask {
  id: string;
  title: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  assignedProjectId?: string;
}

export interface AppSettings {
  workspaceRoot: string;
  theme: 'graphite-cyan' | 'graphite-amber' | 'graphite-emerald' | 'pure-dark';
  enableMotion: boolean;
  fontScale: 'compact' | 'standard' | 'large';
  terminalFontSize: number;
  terminalFontFamily: string;
  preferredEditorCommand: string;
  containerRuntimePreference: 'docker' | 'podman' | 'auto';
  auditLogRetentionDays: number;
  safeEjectAutoFlush: boolean;
  autoAcknowledgeAuthorizedScope: boolean;
  showScanlines: boolean;
  playTacticalAudio: boolean;
}

export interface VirtualFile {
  path: string;
  name: string;
  language: string;
  content: string;
  isModified?: boolean;
  isStaged?: boolean;
  status?: 'modified' | 'added' | 'untracked' | 'clean';
  sizeBytes?: number;
  lastModifiedAt?: string;
  diff?: {
    added: string[];
    removed: string[];
    unified: string;
  };
}

export interface FileOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
