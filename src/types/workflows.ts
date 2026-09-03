/**
 * Production-Grade Workflow Data Models & State Structures
 * Architecture Specification for Citadel Air-Gapped OS & Tauri IPC Engine
 *
 * Covers:
 * 1. Cybersecurity (SOC / SecOps Workflow)
 * 2. DevOps / Site Reliability Engineering (SRE Workflow)
 * 3. Data Science & Machine Learning (MLOps Workflow)
 * 4. Software Development / System Engineering Workflow
 */

// ============================================================================
// 1. CYBERSECURITY (SOC / SECOPS WORKFLOW)
// ============================================================================

export type CvssSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CvssMetricsV31 {
  version: '3.1';
  vectorString: string; // e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
  baseScore: number;
  baseSeverity: CvssSeverity;
  exploitabilityScore: number;
  impactScore: number;
  attackVector: 'NETWORK' | 'ADJACENT_NETWORK' | 'LOCAL' | 'PHYSICAL';
  attackComplexity: 'LOW' | 'HIGH';
  privilegesRequired: 'NONE' | 'LOW' | 'HIGH';
  userInteraction: 'NONE' | 'REQUIRED';
  scope: 'UNCHANGED' | 'CHANGED';
  confidentialityImpact: 'NONE' | 'LOW' | 'HIGH';
  integrityImpact: 'NONE' | 'LOW' | 'HIGH';
  availabilityImpact: 'NONE' | 'LOW' | 'HIGH';
}

export interface MitreAttackTtp {
  tacticId: string; // e.g. "TA0001" (Initial Access)
  tacticName: string;
  techniqueId: string; // e.g. "T1190" (Exploit Public-Facing Application)
  techniqueName: string;
  subTechniqueId?: string; // e.g. "T1059.004" (Unix Shell)
  subTechniqueName?: string;
  killChainPhase: 'Reconnaissance' | 'Weaponization' | 'Delivery' | 'Exploitation' | 'Installation' | 'C2' | 'Actions on Objectives';
  detectionSignatures: string[]; // e.g. ["sigma:proc_creation_win_webshell.yml", "suricata:ET_EXPLOIT_HTTP_POST"]
}

export type ThreatDetectionStatus =
  | 'INGESTED'
  | 'TRIAGED'
  | 'HUNTING_ACTIVE'
  | 'CONTAINED'
  | 'MITIGATED'
  | 'FALSE_POSITIVE'
  | 'RESOLVED';

export interface TargetNode {
  nodeId: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  osFamily: 'Linux' | 'Darwin' | 'Windows';
  kernelRelease: string;
  enclave: string; // e.g. "DMZ-VLAN-104", "Prod-Kube-Worker-03"
  agentVersion: string;
  criticality: 'TIER_0' | 'TIER_1' | 'TIER_2' | 'TIER_3';
}

export interface PlaybookStep {
  stepNumber: number;
  title: string;
  commandSnippet?: string;
  automated: boolean;
  expectedOutputRegex?: string;
  verificationCmd?: string;
  rollbackCmd?: string;
}

export interface RemediationPlaybook {
  playbookId: string;
  title: string;
  cveCorrelation: string[];
  mitreTechniques: string[];
  author: string;
  version: string;
  estimatedTimeToRemediateMinutes: number;
  requiresReboot: boolean;
  steps: PlaybookStep[];
  containmentProtocol: 'ISOLATE_NETWORK_INTERFACE' | 'KILL_PROCESS_TREE' | 'REVOKE_KERBEROS_TICKET' | 'FREEZE_CGROUP';
}

export interface ThreatHuntingFeedItem {
  id: string;
  indicatorId: string; // e.g. "TH-2026-0841"
  cveId: string; // e.g. "CVE-2024-3094", "CVE-2024-6387"
  cvss: CvssMetricsV31;
  mitreMapping: MitreAttackTtp;
  title: string;
  description: string;
  threatActorGroup?: string; // e.g. "APT29", "Volt Typhoon"
  affectedTargets: TargetNode[];
  detectionStatus: ThreatDetectionStatus;
  firstSeenTimestamp: string;
  lastTelemetryTimestamp: string;
  confidenceScore: number; // 0.00 to 1.00
  iocs: {
    sha256Hashes: string[];
    ipv4Indicators: string[];
    domainIndicators: string[];
    ja4Fingerprints: string[];
  };
  remediationPlaybook: RemediationPlaybook;
}

// Live Network Telemetry Subsystem
export interface PcapAnalysisSummary {
  captureSessionId: string;
  interfaceName: string;
  durationSeconds: number;
  totalPackets: number;
  totalBytes: number;
  dropratePercent: number;
  protocolBreakdown: {
    tcpBytes: number;
    udpBytes: number;
    icmpBytes: number;
    tlsBytes: number;
    dnsBytes: number;
    sshBytes: number;
  };
  anomaliesDetected: {
    synFloodSuspected: boolean;
    outOfOrderPackets: number;
    retransmissionCount: number;
    rstFlagSpikeRateSec: number;
  };
}

export interface OpenPortFinding {
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed';
  serviceName: string;
  productBanner: string;
  versionString: string;
  cpe: string; // Common Platform Enumeration
  nseScriptFindings: Array<{
    scriptId: string;
    output: string;
    vulnerabilityAlert?: string;
  }>;
}

export interface FirewallRuleViolation {
  violationId: string;
  timestamp: string;
  ruleName: string;
  chain: 'INPUT' | 'FORWARD' | 'OUTPUT' | 'PREROUTING';
  action: 'DROP' | 'REJECT' | 'LOG';
  srcIp: string;
  srcPort: number;
  dstIp: string;
  dstPort: number;
  transportProto: 'TCP' | 'UDP' | 'ICMP';
  threatIntelMatch?: {
    feedName: string;
    reputationScore: number;
    geoCountry: string;
    autonomousSystem: string;
  };
}

export interface ActiveNetworkSocket {
  protocol: 'tcp' | 'tcp6' | 'udp' | 'udp6';
  localAddress: string;
  localPort: number;
  foreignAddress: string;
  foreignPort: number;
  state: 'ESTABLISHED' | 'SYN_SENT' | 'SYN_RECV' | 'FIN_WAIT1' | 'CLOSE_WAIT' | 'TIME_WAIT' | 'LISTEN';
  pid: number;
  processName: string;
  user: string;
  inodeNumber: number;
  rxQueueBytes: number;
  txQueueBytes: number;
}

export interface SuspiciousEgressPayloadFlag {
  flagId: string;
  timestamp: string;
  sourcePid: number;
  processBinary: string;
  destinationEndpoint: string;
  destinationPort: number;
  shannonEntropyScore: number; // > 7.5 indicates encrypted/compressed payload or stego
  payloadPreviewHex: string;
  heuristicType: 'DNS_TUNNELING_BURST' | 'BEACONING_INTERVAL_JITTER' | 'HIGH_ENTROPY_EGRESS' | 'UNUSUAL_ASN_TRANSFER';
  isInterdicted: boolean;
}

export interface LiveNetworkTelemetryReport {
  telemetryId: string;
  collectedAt: string;
  sensorNodeId: string;
  pcapSummary: PcapAnalysisSummary;
  openPortScans: OpenPortFinding[];
  firewallViolations: FirewallRuleViolation[];
  activeSockets: ActiveNetworkSocket[];
  suspiciousEgressFlags: SuspiciousEgressPayloadFlag[];
}

// ============================================================================
// 2. DEVOPS / SITE RELIABILITY ENGINEERING (SRE WORKFLOW)
// ============================================================================

export type PipelineStageType = 'LINT' | 'TEST' | 'SAST' | 'CONTAINERIZE' | 'DEPLOY';
export type StageExecutionStatus = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED' | 'ROLLED_BACK';

export interface SastFinding {
  ruleId: string;
  scanner: 'semgrep' | 'trivy' | 'gitleaks' | 'snyk';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  filePath: string;
  startLine: number;
  endLine: number;
  title: string;
  cweId: string; // e.g. "CWE-89" (SQL Injection), "CWE-798" (Hardcoded Credentials)
}

export interface BuildStageExecution {
  stageId: string;
  stageName: string;
  stageType: PipelineStageType;
  status: StageExecutionStatus;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  exitCode: number;
  logsTail: string[];
  sastFindings?: SastFinding[];
}

export interface DeploymentRollbackInfo {
  initiated: boolean;
  rollbackTriggeredAt?: string;
  targetRevisionHash: string;
  reason: 'HELM_HEALTH_CHECK_TIMEOUT' | 'CANARY_HTTP_5XX_SPIKE' | 'PROMETHEUS_P99_BREACH';
  automatedBlastRadiusRestored: boolean;
}

export interface CiCdPipelineRun {
  pipelineId: string;
  repoSlug: string;
  commitSha: string;
  commitMessage: string;
  commitAuthor: string;
  branch: string;
  triggerEvent: 'push' | 'pull_request' | 'merge_queue' | 'scheduled_security_audit';
  deploymentStrategy: 'rolling_update' | 'canary_10_percent' | 'blue_green';
  targetClusterEnvironment: 'staging-k8s-us-east' | 'production-airgap-k8s-eu';
  overallStatus: StageExecutionStatus;
  stages: BuildStageExecution[];
  deploymentLatencies: {
    totalDurationSeconds: number;
    lintDurationSeconds: number;
    testDurationSeconds: number;
    sastDurationSeconds: number;
    containerizeDurationSeconds: number;
    clusterDeployDurationSeconds: number;
    p95LatencyServingMs: number;
    p99LatencyServingMs: number;
  };
  rollbackInfo?: DeploymentRollbackInfo;
}

// Kubernetes & Cluster Health Model
export interface K8sNodeResourceCapacity {
  nodeName: string;
  role: 'control-plane' | 'worker' | 'infra';
  status: 'Ready' | 'NotReady' | 'SchedulingDisabled';
  cpuCoresAllocatable: number;
  cpuCoresRequested: number;
  cpuUtilizationPercent: number;
  memoryBytesCapacity: number;
  memoryBytesAllocatable: number;
  memoryUtilizationPercent: number;
  ephemeralStorageFreePercent: number;
  kubeletVersion: string;
  containerRuntime: string;
}

export interface K8sPodState {
  podName: string;
  namespace: string;
  nodeAssigned: string;
  phase: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'Failed' | 'Completed';
  restartCount: number;
  lastRestartReason?: 'OOMKilled' | 'LivenessProbeFailed' | 'HostKernelPanic' | 'SIGKILL_SIGSEGV';
  cpuCoresUsage: number;
  memoryBytesRss: number;
  createdAt: string;
}

export interface IngressControllerRoute {
  ingressName: string;
  namespace: string;
  hostname: string;
  path: string;
  upstreamServiceName: string;
  upstreamPort: number;
  tlsSecretName: string;
  tlsCertExpiryDate: string;
  tlsCertDaysRemaining: number;
  rateLimitRps: number;
}

export interface PrometheusAlertTrigger {
  alertName: string;
  severity: 'page' | 'critical' | 'warning' | 'info';
  state: 'firing' | 'pending' | 'resolved';
  activeSince: string;
  expression: string;
  summary: string;
  description: string;
  runbookUrl: string;
  labels: Record<string, string>;
}

export interface KubernetesInfrastructureState {
  clusterName: string;
  kubernetesVersion: string;
  clusterHealthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  controlPlaneState: {
    etcdLeaderElected: boolean;
    etcdRaftTerm: number;
    apiServerP99LatencyMs: number;
    schedulerHealthy: boolean;
    controllerManagerHealthy: boolean;
  };
  nodes: K8sNodeResourceCapacity[];
  criticalPods: K8sPodState[];
  ingressRoutes: IngressControllerRoute[];
  activeAlerts: PrometheusAlertTrigger[];
}

// ============================================================================
// 3. DATA SCIENCE & MACHINE LEARNING (MLOPS WORKFLOW)
// ============================================================================

export interface ModelHyperparameters {
  architecture: string; // e.g. "RoBERTa-SecAudit-v2", "XGBoost-ThreatClf"
  learningRate: number;
  batchSize: number;
  epochs: number;
  optimizer: 'AdamW' | 'SGD_Nesterov' | 'Adafactor';
  weightDecay: number;
  warmupRatio: number;
  dropoutRate: number;
  mixedPrecision: 'fp16' | 'bf16' | 'fp32';
  gradientAccumulationSteps: number;
}

export interface LossCurvePoint {
  epoch: number;
  step: number;
  trainingLoss: number;
  validationLoss: number;
  learningRateCurrent: number;
}

export interface ValidationMetricsEvaluation {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAucScore: number;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
}

export interface ModelDriftDetectionFlag {
  featureName: string;
  testStatistic: 'Kolmogorov-Smirnov' | 'Population_Stability_Index_PSI' | 'Wasserstein_Distance';
  statisticValue: number;
  threshold: number;
  driftDetected: boolean;
  pVal: number;
  actionRequired: 'RECALIBRATE_WEIGHTS' | 'ALERT_PIPELINE_ENGINEER' | 'NO_ACTION';
}

export interface ModelTrainingRun {
  runId: string;
  experimentName: string;
  modelRegistryTag: string; // e.g. "network-intrusion-detector:v3.2.1"
  trainingStatus: 'QUEUED' | 'TRAINING' | 'EVALUATING' | 'COMPLETED' | 'EARLY_STOPPED' | 'FAILED';
  currentEpoch: number;
  totalEpochs: number;
  stepProgressPercent: number;
  etaSecondsRemaining: number;
  deviceHardware: {
    gpuModel: string;
    vramUsedMb: number;
    vramTotalMb: number;
    gpuUtilizationPercent: number;
    cudaVersion: string;
  };
  hyperparameters: ModelHyperparameters;
  lossHistory: LossCurvePoint[];
  evaluationMetrics: ValidationMetricsEvaluation;
  driftFlags: ModelDriftDetectionFlag[];
}

export interface FeatureStorePipeline {
  featureViewId: string;
  entityName: string; // e.g. "source_ip", "user_session", "packet_stream"
  offlineTableSink: string; // e.g. "duckdb://warehouse/features_offline.parquet"
  onlineStoreRedisSync: boolean;
  lastIngestionSyncTimestamp: string;
  recordsIngestedTotal: number;
  syncLatencyP99Ms: number;
  ttlDays: number;
}

export interface DvcDatasetVersion {
  datasetName: string;
  dvcHash: string;
  gitCommitRef: string;
  storageUri: string; // e.g. "s3://citadel-mlops-store/datasets/pcap_cyberguard_2026.parquet"
  totalRows: number;
  totalColumns: number;
  fileSizeBytes: number;
  compressedParquetSizeBytes: number;
  schemaChecksum: string;
}

export interface DataSkewMetric {
  featureColumn: string;
  trainingMean: number;
  servingMean: number;
  distributionVarianceRatio: number;
  nullValueSpikePercent: number;
  skewSeverity: 'LOW' | 'MODERATE' | 'HIGH_ACTION_REQUIRED';
}

export interface InferenceLatencyBenchmark {
  engine: 'ONNX_Runtime_TensorRT' | 'PyTorch_JIT' | 'VLLM_Cuda';
  quantization: 'INT8' | 'FP16' | 'FP32';
  batchSize: number;
  concurrentRequests: number;
  p50LatencyMs: number;
  p90LatencyMs: number;
  p99LatencyMs: number;
  throughputQueriesPerSec: number;
  gpuVramFootprintMb: number;
}

export interface MLOpsPipelineOrchestrationState {
  orchestrationCluster: string;
  activeModelRuns: ModelTrainingRun[];
  featureStorePipelines: FeatureStorePipeline[];
  datasetVersions: DvcDatasetVersion[];
  skewMetrics: DataSkewMetric[];
  inferenceBenchmarks: InferenceLatencyBenchmark[];
}

// ============================================================================
// 4. SOFTWARE DEVELOPMENT / SYSTEM ENGINEERING
// ============================================================================

export interface ProcessTreeNode {
  pid: number;
  ppid: number;
  name: string;
  commandLine: string;
  user: string;
  state: 'R (Running)' | 'S (Interruptible Sleep)' | 'D (Uninterruptible Disk Sleep)' | 'Z (Zombie)';
  rssBytes: number;
  vmsBytes: number;
  cpuUtilizationPercent: number;
  cpuCoreAffinity: number[]; // e.g. [0, 1, 2, 3]
  threadCount: number;
  niceScore: number;
  cgroupSlice: string; // e.g. "system.slice/docker.service"
  openFileDescriptorsCount: number;
  children?: ProcessTreeNode[];
}

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface LspCodeAction {
  title: string;
  kind: 'quickfix' | 'refactor' | 'source.organizeImports';
  isPreferred: boolean;
  editPreview?: string;
}

export interface LspDiagnosticEntry {
  id: string;
  sourceFileUri: string;
  languageId: 'typescript' | 'rust' | 'python' | 'go' | 'c';
  severity: 'ERROR' | 'WARNING' | 'INFORMATION' | 'HINT';
  code: string; // e.g. "E0308" (mismatched types), "TS2345", "F841"
  sourceEngine: 'rust-analyzer' | 'tsserver' | 'pyright' | 'gopls' | 'clangd';
  message: string;
  range: LspRange;
  codeActions: LspCodeAction[];
}

export interface GitDiffHunk {
  header: string; // e.g. "@@ -45,7 +45,9 @@"
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

export interface GitStagedDiff {
  oldPath: string;
  newPath: string;
  status: 'MODIFIED' | 'ADDED' | 'DELETED' | 'RENAMED';
  similarityIndex?: number;
  hunks: GitDiffHunk[];
}

export interface GitMergeConflictFile {
  filePath: string;
  conflictMarkerStartLine: number;
  currentBranchHeadContent: string;
  incomingBranchContent: string;
  commonAncestorContent?: string;
}

export interface GitExtendedRepoState {
  repositoryRoot: string;
  currentBranchHeadSha: string;
  branchName: string;
  upstreamRemoteUrl: string;
  upstreamTrackingStatus: {
    aheadCount: number;
    behindCount: number;
  };
  stagedDiffs: GitStagedDiff[];
  unstagedChangedFilesCount: number;
  untrackedFilesCount: number;
  mergeConflicts: GitMergeConflictFile[];
  activeLspDiagnostics: LspDiagnosticEntry[];
  osProcessHierarchy: ProcessTreeNode;
}
