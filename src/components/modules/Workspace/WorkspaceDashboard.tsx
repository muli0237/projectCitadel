import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Container,
  Database,
  Terminal,
  Activity,
  Search,
  CheckCircle2,
  Play,
  Pause,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  FolderGit2,
  FileCode,
  Info,
  GitBranch,
  Folder,
  Cpu,
  HardDrive,
  Check,
  Radio,
} from 'lucide-react';
import { Project, ModuleId } from '../../../types';
import { ASSET_MANIFEST } from '../../../assets/assetManifest';

// Asset references
import heroBgSvg from '../../../assets/images/hero_control_plane_grid.svg';
import secopsCardSvg from '../../../assets/images/card_secops_vector.svg';
import devopsCardSvg from '../../../assets/images/card_devops_vector.svg';
import datascienceCardSvg from '../../../assets/images/card_datascience_vector.svg';
import codelabCardSvg from '../../../assets/images/card_code_lab_vector.svg';
import emptyStateSvg from '../../../assets/images/empty_state_illustration.svg';

interface WorkspaceDashboardProps {
  onNavigateModule?: (moduleId: ModuleId) => void;
  onLaunchProject?: (projectId: string) => void;
  activeProject?: Project | null;
}

interface LogEvent {
  id: string;
  timestamp: string;
  subsystem: 'SEC_AUDIT' | 'CONTAINER' | 'FORGE' | 'NETWORK' | 'KERNEL';
  severity: 'INFO' | 'WARN' | 'CRIT';
  message: string;
  traceId: string;
}

const INITIAL_LOG_EVENTS: LogEvent[] = [
  {
    id: 'evt-1001',
    timestamp: new Date(Date.now() - 42000).toISOString(),
    subsystem: 'SEC_AUDIT',
    severity: 'INFO',
    message: 'Perimeter check nominal. Zero untrusted key exchange requests.',
    traceId: 'TRC-7701-SEC',
  },
  {
    id: 'evt-1002',
    timestamp: new Date(Date.now() - 36000).toISOString(),
    subsystem: 'CONTAINER',
    severity: 'INFO',
    message: 'Rootless Podman daemon initialized at unix:///run/user/1000/podman.sock',
    traceId: 'TRC-7702-POD',
  },
  {
    id: 'evt-1003',
    timestamp: new Date(Date.now() - 29000).toISOString(),
    subsystem: 'FORGE',
    severity: 'INFO',
    message: 'Python virtual environment verified with strict isolation profile.',
    traceId: 'TRC-7703-VENV',
  },
  {
    id: 'evt-1004',
    timestamp: new Date(Date.now() - 22000).toISOString(),
    subsystem: 'NETWORK',
    severity: 'WARN',
    message: 'Outbound SYN dropped on eno1 by local air-gap firewall rule #412.',
    traceId: 'TRC-7704-FW',
  },
  {
    id: 'evt-1005',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    subsystem: 'SEC_AUDIT',
    severity: 'INFO',
    message: 'Local TLS trust chain validated against offline root anchor.',
    traceId: 'TRC-7705-TLS',
  },
  {
    id: 'evt-1006',
    timestamp: new Date(Date.now() - 8000).toISOString(),
    subsystem: 'KERNEL',
    severity: 'INFO',
    message: 'Seccomp filter loaded: 142 syscalls allowed for unprivileged sandbox workers.',
    traceId: 'TRC-7706-BPF',
  },
];

const LOG_TEMPLATES: Array<{ subsystem: LogEvent['subsystem']; severity: LogEvent['severity']; msg: string }> = [
  { subsystem: 'SEC_AUDIT', severity: 'INFO', msg: 'Partition integrity verified: SHA-256 matches manifest.' },
  { subsystem: 'CONTAINER', severity: 'INFO', msg: 'Container layer scan finished: 0 critical vulnerabilities in debian-slim.' },
  { subsystem: 'FORGE', severity: 'INFO', msg: 'Tensor calculation pipeline cache synced with SQLite metadata store.' },
  { subsystem: 'NETWORK', severity: 'INFO', msg: 'Loopback socket throughput stable at 840 MB/s. Zero dropped frames.' },
  { subsystem: 'SEC_AUDIT', severity: 'WARN', msg: 'Restricted path access attempt to /sys/kernel/debug denied safely.' },
  { subsystem: 'FORGE', severity: 'INFO', msg: 'Jupyter kernel heartbeat verified. 4 worker execution threads available.' },
  { subsystem: 'CONTAINER', severity: 'INFO', msg: 'Podman cgroup v2 memory limits enforced (max 2048 MiB).' },
  { subsystem: 'KERNEL', severity: 'INFO', msg: 'System entropy pool refreshed for cryptographic operations.' },
];

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({
  onNavigateModule,
  onLaunchProject,
  activeProject,
}) => {
  const [logs, setLogs] = useState<LogEvent[]>(INITIAL_LOG_EVENTS);
  const [searchFilter, setSearchFilter] = useState('');
  const [subsystemFilter, setSubsystemFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);

  const [telemetry, setTelemetry] = useState({
    tickCount: 142,
    threatScore: 0.02,
    activeSandboxes: 3,
    memoryUsageMb: 412,
    cpuLoadPct: 14.8,
  });

  const [imgFailed, setImgFailed] = useState<{ [key: string]: boolean }>({});

  const markImgFailed = (key: string) => {
    setImgFailed((prev) => ({ ...prev, [key]: true }));
  };

  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const nextTick = prev.tickCount + 1;
        const jitter = Math.sin(nextTick / 6) * 0.01;
        return {
          ...prev,
          tickCount: nextTick,
          threatScore: Math.max(0.01, Math.min(0.05, +(0.02 + jitter).toFixed(3))),
          memoryUsageMb: 410 + (nextTick % 18),
          cpuLoadPct: +(12.0 + Math.abs(Math.sin(nextTick / 5) * 6.0)).toFixed(1),
        };
      });

      const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
      const newEvent: LogEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        subsystem: template.subsystem,
        severity: template.severity,
        message: template.msg,
        traceId: `TRC-${Math.floor(7000 + Math.random() * 2000)}-${template.subsystem.slice(0, 3)}`,
      };

      setLogs((prev) => {
        const updated = [...prev, newEvent];
        return updated.length > 80 ? updated.slice(updated.length - 80) : updated;
      });
    }, 5500);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSubsystem = subsystemFilter === 'ALL' || log.subsystem === subsystemFilter;
      const matchesSearch =
        searchFilter.trim() === '' ||
        log.message.toLowerCase().includes(searchFilter.toLowerCase()) ||
        log.subsystem.toLowerCase().includes(searchFilter.toLowerCase()) ||
        log.traceId.toLowerCase().includes(searchFilter.toLowerCase());

      return matchesSubsystem && matchesSearch;
    });
  }, [logs, subsystemFilter, searchFilter]);

  return (
    <div className="w-full h-full flex flex-col bg-[#030712] text-[#f1f5f9] overflow-y-auto select-none font-sans relative">
      
      {/* Subtle Atmospheric Top Gradient */}
      <div 
        className="absolute top-0 inset-x-0 h-96 pointer-events-none opacity-40 z-0 bg-gradient-to-b from-[#08152e] via-[#050b18] to-transparent" 
      />

      <div className="relative z-10 p-5 md:p-8 space-y-6 max-w-7xl mx-auto w-full">

        {/* ==================================================================== */}
        {/* 1. CALM HERO PANEL                                                   */}
        {/* ==================================================================== */}
        <section 
          aria-label="Workspace Readiness"
          className="relative overflow-hidden rounded-lg border border-slate-800/80 bg-[#060e1d]/90 shadow-sm"
        >
          {/* Hero Media Background Layer with controlled opacity & gradient overlays */}
          <div className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none z-0">
            {!imgFailed['hero'] ? (
              <img
                src={heroBgSvg}
                alt=""
                onError={() => markImgFailed('hero')}
                className="w-full h-full object-cover opacity-20 filter contrast-125"
              />
            ) : (
              <div className="w-full h-full bg-[#050c1b]" />
            )}

            {/* Controlled readability mask */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#060e1d] via-[#060e1d]/90 to-[#060e1d]/75" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060e1d] via-transparent to-transparent" />
          </div>

          {/* Hero Foreground Content */}
          <div className="relative z-10 p-6 md:p-8 flex flex-col justify-between min-h-[190px]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Enclave Ready</span>
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Citadel v2.4 • Air-Gap Isolated
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                  Security & Engineering Workspace
                </h1>

                <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                  {activeProject ? (
                    <>Active workspace mounted at <span className="font-mono text-cyan-300">{activeProject.name}</span>. Portable isolation profile loaded with rootless sandboxing.</>
                  ) : (
                    <>All local security tools, container sandboxes, and data analytics pipelines are operational and isolated within encrypted storage.</>
                  )}
                </p>
              </div>

              {/* Concise Telemetry Summary */}
              <div className="grid grid-cols-2 gap-3 shrink-0 bg-[#040915]/80 p-3.5 rounded-md border border-slate-800 backdrop-blur-sm min-w-[240px]">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Threat Index</div>
                  <div className="text-sm font-mono font-medium text-emerald-400 flex items-center gap-1.5 tabular-nums">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{telemetry.threatScore.toFixed(3)} (Nominal)</span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Sandboxes</div>
                  <div className="text-sm font-mono font-medium text-cyan-300 flex items-center gap-1.5 tabular-nums">
                    <Container className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{telemetry.activeSandboxes} Running</span>
                  </div>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Memory Buffer</div>
                  <div className="text-xs font-mono text-slate-200 tabular-nums">
                    {telemetry.memoryUsageMb} MiB / 2048 MiB
                  </div>
                </div>

                <div className="space-y-0.5 pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] font-mono uppercase text-slate-400">CPU Load</div>
                  <div className="text-xs font-mono text-slate-200 tabular-nums">
                    {telemetry.cpuLoadPct}%
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-800/80 text-xs font-mono mt-4">
              <div className="flex items-center gap-2 text-slate-400">
                <span>STORAGE VOLUME:</span>
                <span className="text-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  LUKS2 Encrypted / Portable
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManifestModal(true)}
                  className="px-2.5 py-1 rounded-md border border-slate-700/60 bg-[#081326] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Asset Manifest</span>
                </button>

                <button
                  onClick={() => setReducedMotion((prev) => !prev)}
                  className="px-2.5 py-1 rounded-md border border-slate-700/60 bg-[#081326] hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  {reducedMotion ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{reducedMotion ? 'Reduced Motion' : 'Standard Motion'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 2. CONCISE SUMMARY CARDS (4 DOMAINS)                                 */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: SECURITY OPERATIONS */}
          <article className="rounded-lg border border-slate-800/80 bg-[#071124]/90 hover:border-slate-700 transition-colors flex flex-col justify-between overflow-hidden shadow-xs">
            <div className="relative h-20 w-full bg-[#050c1c] overflow-hidden border-b border-slate-800/80">
              {!imgFailed['secops'] ? (
                <img
                  src={secopsCardSvg}
                  alt=""
                  onError={() => markImgFailed('secops')}
                  className="w-full h-full object-cover opacity-40"
                />
              ) : (
                <div className="w-full h-full bg-[#050c1c] flex items-center justify-center">
                  <Shield className="w-8 h-8 text-cyan-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071124] via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-2.5 left-3 flex items-center gap-2 z-10">
                <div className="p-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  Security Operations
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed">
                Penetration testing arsenal, network map captures, and compliance auditors.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Vulnerabilities:</span>
                  <span className="text-emerald-400 font-medium tabular-nums">0 Critical</span>
                </div>
                <button
                  onClick={() => onNavigateModule && onNavigateModule('toolbox')}
                  className="w-full py-1.5 px-3 rounded-md bg-[#0a1832] hover:bg-cyan-950 border border-slate-700/60 hover:border-cyan-500/40 text-cyan-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Open Tool Arsenal</span>
                </button>
              </div>
            </div>
          </article>

          {/* CARD 2: DEVOPS CONTROL */}
          <article className="rounded-lg border border-slate-800/80 bg-[#071124]/90 hover:border-slate-700 transition-colors flex flex-col justify-between overflow-hidden shadow-xs">
            <div className="relative h-20 w-full bg-[#050c1c] overflow-hidden border-b border-slate-800/80">
              {!imgFailed['devops'] ? (
                <img
                  src={devopsCardSvg}
                  alt=""
                  onError={() => markImgFailed('devops')}
                  className="w-full h-full object-cover opacity-40"
                />
              ) : (
                <div className="w-full h-full bg-[#050c1c] flex items-center justify-center">
                  <Container className="w-8 h-8 text-violet-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071124] via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-2.5 left-3 flex items-center gap-2 z-10">
                <div className="p-1 rounded-md bg-violet-950/80 border border-violet-500/30 text-violet-400">
                  <Container className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  DevOps & Containers
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed">
                Rootless Podman sandbox daemons and isolated pipeline worktrees.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Runtime:</span>
                  <span className="text-slate-200 font-medium">Podman Rootless</span>
                </div>
                <button
                  onClick={() => onNavigateModule && onNavigateModule('devops-bay')}
                  className="w-full py-1.5 px-3 rounded-md bg-[#0a1832] hover:bg-violet-950 border border-slate-700/60 hover:border-violet-500/40 text-violet-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Container className="w-3.5 h-3.5" />
                  <span>DevOps Bay</span>
                </button>
              </div>
            </div>
          </article>

          {/* CARD 3: DATA SCIENCE FORGE */}
          <article className="rounded-lg border border-slate-800/80 bg-[#071124]/90 hover:border-slate-700 transition-colors flex flex-col justify-between overflow-hidden shadow-xs">
            <div className="relative h-20 w-full bg-[#050c1c] overflow-hidden border-b border-slate-800/80">
              {!imgFailed['datasci'] ? (
                <img
                  src={datascienceCardSvg}
                  alt=""
                  onError={() => markImgFailed('datasci')}
                  className="w-full h-full object-cover opacity-40"
                />
              ) : (
                <div className="w-full h-full bg-[#050c1c] flex items-center justify-center">
                  <Database className="w-8 h-8 text-emerald-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071124] via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-2.5 left-3 flex items-center gap-2 z-10">
                <div className="p-1 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  Data Science Lab
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed">
                Jupyter notebooks, dataset caching, and local scientific computation.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Kernel:</span>
                  <span className="text-emerald-400 font-medium">Python 3.12 Ready</span>
                </div>
                <button
                  onClick={() => onNavigateModule && onNavigateModule('data-lab')}
                  className="w-full py-1.5 px-3 rounded-md bg-[#0a1832] hover:bg-emerald-950 border border-slate-700/60 hover:border-emerald-500/40 text-emerald-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Launch Data Lab</span>
                </button>
              </div>
            </div>
          </article>

          {/* CARD 4: DEVELOPMENT WORKSPACE */}
          <article className="rounded-lg border border-slate-800/80 bg-[#071124]/90 hover:border-slate-700 transition-colors flex flex-col justify-between overflow-hidden shadow-xs">
            <div className="relative h-20 w-full bg-[#050c1c] overflow-hidden border-b border-slate-800/80">
              {!imgFailed['codelab'] ? (
                <img
                  src={codelabCardSvg}
                  alt=""
                  onError={() => markImgFailed('codelab')}
                  className="w-full h-full object-cover opacity-40"
                />
              ) : (
                <div className="w-full h-full bg-[#050c1c] flex items-center justify-center">
                  <FileCode className="w-8 h-8 text-blue-500/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#071124] via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute top-2.5 left-3 flex items-center gap-2 z-10">
                <div className="p-1 rounded-md bg-blue-950/80 border border-blue-500/30 text-blue-400">
                  <FolderGit2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-white">
                  Code & Runbooks
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
              <p className="text-xs text-slate-300 leading-relaxed">
                Repository worktrees, Markdown documentation, and terminal scripts.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Git Scope:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[120px]">
                    {activeProject?.gitBranch || 'Standby'}
                  </span>
                </div>
                <button
                  onClick={() => onNavigateModule && onNavigateModule('code-lab')}
                  className="w-full py-1.5 px-3 rounded-md bg-[#0a1832] hover:bg-blue-950 border border-slate-700/60 hover:border-blue-500/40 text-blue-300 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Open Code Lab</span>
                </button>
              </div>
            </div>
          </article>

        </div>

        {/* ==================================================================== */}
        {/* 3. TWO-COLUMN LOWER SECTION                                          */}
        {/* Left: Active Workspace Details | Right: Subordinate Telemetry Stream */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: ACTIVE WORKSPACE & ARCHITECTURE DETAILS (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            
            <section 
              aria-label="Active Workspace Configuration"
              className="rounded-lg border border-slate-800/80 bg-[#071124]/90 p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Workspace Partition
                  </h2>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  LUKS2 Encrypted
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Active Project Target</span>
                  <div className="text-sm font-medium text-white mt-0.5 flex items-center justify-between">
                    <span>{activeProject ? activeProject.name : 'No project selected'}</span>
                    {activeProject && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                        {activeProject.category}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs font-mono">
                  <div className="p-2.5 rounded-md bg-[#040915] border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">GIT BRANCH</span>
                    {activeProject?.gitBranch ? (
                      <span className="text-cyan-300 font-medium flex items-center gap-1 truncate">
                        <GitBranch className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{activeProject.gitBranch}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Unassigned</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-md bg-[#040915] border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">VIRTUALENV</span>
                    {activeProject?.hasVirtualEnv ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-slate-500">Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-mono text-slate-400">Portable Directory Structure:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>/projects</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>/notes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>/datasets</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>/tool-profiles</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: EVENT STREAM (SUBORDINATE, CLEAN) (7 COLS) */}
          <div className="lg:col-span-7">
            
            <section 
              aria-label="Enclave Audit Stream"
              className="rounded-lg border border-slate-800/80 bg-[#071124]/90 p-5 space-y-3.5 shadow-xs"
            >
              {/* Header & Controls */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                    Enclave Audit Stream
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoScroll((prev) => !prev)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer border ${
                      autoScroll
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {autoScroll ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-slate-400" />}
                    <span>{autoScroll ? 'Live' : 'Paused'}</span>
                  </button>
                </div>
              </div>

              {/* Filtering Subsystem Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-1">
                  {['ALL', 'SEC_AUDIT', 'CONTAINER', 'FORGE', 'NETWORK'].map((subsys) => (
                    <button
                      key={subsys}
                      onClick={() => setSubsystemFilter(subsys)}
                      className={`px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer ${
                        subsystemFilter === subsys
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                          : 'bg-[#040915] text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {subsys}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#040915] border border-slate-800 rounded-md max-w-[200px] w-full">
                  <Search className="w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full bg-transparent border-none text-[11px] font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Log Stream Window (Subordinate, Quiet) */}
              <div
                ref={logContainerRef}
                className="h-64 overflow-y-auto rounded-md bg-[#030712] border border-slate-800/80 p-2.5 font-mono text-[11px] space-y-1.5 select-text"
              >
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-baseline justify-between p-1.5 rounded-sm hover:bg-slate-900/60 transition-colors gap-2 text-slate-300"
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-slate-400 text-[10px] shrink-0 tabular-nums">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>

                        <span
                          className={`px-1 py-0.2 rounded-xs text-[9px] font-medium shrink-0 ${
                            log.severity === 'WARN'
                              ? 'text-amber-400 bg-amber-950/40'
                              : 'text-cyan-400 bg-cyan-950/40'
                          }`}
                        >
                          {log.subsystem}
                        </span>

                        <span className="text-slate-200 truncate">{log.message}</span>
                      </div>

                      <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                        {log.traceId}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <img
                      src={emptyStateSvg}
                      alt="No matching logs"
                      className="w-32 h-20 object-contain opacity-40"
                    />
                    <p className="text-xs">No audit events match the active filter.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                <span>BUFFER: 80 ENTRIES</span>
                <span>AIR-GAP ENFORCED</span>
              </div>
            </section>

          </div>

        </div>

      </div>

      {/* ASSET & TYPOGRAPHY MANIFEST MODAL */}
      {showManifestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#071124] border border-slate-700 rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Asset & Typography Manifest
                </h2>
              </div>
              <button
                onClick={() => setShowManifestModal(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close manifest modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 text-xs text-slate-300">
              <p className="leading-relaxed text-slate-400">
                {ASSET_MANIFEST.complianceNotice}
              </p>

              <div className="space-y-1.5 pt-2">
                <div className="text-white font-medium">Typography (Zero Remote CDN)</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-[#040915] border border-slate-800 rounded-md">
                    <div className="text-cyan-300">Space Grotesk</div>
                    <div className="text-slate-400 text-[10px]">Interface & Headings</div>
                  </div>
                  <div className="p-2 bg-[#040915] border border-slate-800 rounded-md">
                    <div className="text-cyan-300">JetBrains Mono</div>
                    <div className="text-slate-400 text-[10px]">Metrics & Logs</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowManifestModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkspaceDashboard;
