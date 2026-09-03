import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Terminal,
  HardDrive,
  FileText,
  Activity,
  Container,
  Database,
  Settings,
  Shield,
  ArrowRight,
  RefreshCw,
  Cpu,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import {
  AuditEntry,
  LaunchedProcess,
  Project,
  ToolchainSnapshot,
} from '../../../types';
import { FloatingWorkspaceWindow } from '../../common/FloatingWorkspaceWindow';

// Subpanel modules
import { OverviewPanel } from './panels/OverviewPanel';
import { ProjectsPanel } from './panels/ProjectsPanel';
import { TerminalPanel } from './panels/TerminalPanel';
import { StoragePanel } from './panels/StoragePanel';
import { LogsPanel } from './panels/LogsPanel';
import { DiagnosticsPanel } from './panels/DiagnosticsPanel';
import { DevOpsPanel } from './panels/DevOpsPanel';
import { DataLabPanel } from './panels/DataLabPanel';
import { SettingsPanel } from './panels/SettingsPanel';

export type PanelSection =
  | 'overview'
  | 'projects'
  | 'terminal'
  | 'storage'
  | 'logs'
  | 'diagnostics'
  | 'devops'
  | 'datalab'
  | 'settings';

interface NavSectionItem {
  id: PanelSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: string;
  statusVariant?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'slate' | 'violet';
  disabled?: boolean;
}

const NAV_SECTIONS: NavSectionItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, status: 'ONLINE', statusVariant: 'emerald' },
  { id: 'projects', label: 'Projects', icon: FolderGit2, status: 'ACTIVE', statusVariant: 'cyan' },
  { id: 'terminal', label: 'Terminal', icon: Terminal, status: 'PTY READY', statusVariant: 'emerald' },
  { id: 'storage', label: 'Storage', icon: HardDrive, status: 'ENCRYPTED', statusVariant: 'cyan' },
  { id: 'logs', label: 'Logs', icon: FileText, status: 'STREAMING', statusVariant: 'cyan' },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity, status: 'HEALTHY', statusVariant: 'emerald' },
  { id: 'devops', label: 'DevOps', icon: Container, status: 'UNAVAILABLE', statusVariant: 'amber' },
  { id: 'datalab', label: 'Data Lab', icon: Database, status: 'UNAVAILABLE', statusVariant: 'amber' },
  { id: 'settings', label: 'Settings', icon: Settings, status: 'CONFIGURED', statusVariant: 'slate' },
];

export const CommandCenter: React.FC = () => {
  const {
    systemMetrics,
    driveHealth,
    activeProject,
    setActiveModule,
    refreshSystemMetrics,
    refreshDriveHealth,
    createTerminalTab,
  } = useCitadelStore();

  const [activePanel, setActivePanel] = useState<PanelSection | null>(null);
  const [toolchain, setToolchain] = useState<ToolchainSnapshot | null>(null);
  const [processes, setProcesses] = useState<LaunchedProcess[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Refs for restoring keyboard focus when floating panels close
  const triggerRefs = useRef<{ [key in PanelSection]?: HTMLButtonElement | null }>({});

  const isNative = isTauriEnvironment();

  const loadData = async () => {
    try {
      const [tc, pList, aList, prList] = await Promise.all([
        bridge.getToolchainSnapshot ? bridge.getToolchainSnapshot() : null,
        bridge.listLaunchedProcesses(),
        bridge.getAuditLogs(),
        bridge.listProjects(),
      ]);
      if (tc) setToolchain(tc);
      setProcesses(pList);
      setAuditLogs(aList);
      setProjects(prList);
    } catch (e) {
      console.error('Error fetching dashboard telemetry:', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const openPanel = (section: PanelSection) => {
    setActivePanel(section);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  // Environment metrics
  const hostname = systemMetrics?.hostname || 'CITADEL-ENCLAVE-01';
  const ipAddress =
    systemMetrics?.networkInterfaces?.[0]?.ipAddresses?.[0]?.split('/')[0] || '10.0.4.15';
  const storageFreeGb = driveHealth
    ? (driveHealth.freeBytes / 1024 ** 3).toFixed(1)
    : '204.2';

  const currentNav = NAV_SECTIONS.find((s) => s.id === activePanel);

  return (
    <div className="h-full w-full relative overflow-hidden flex flex-col justify-between bg-transparent text-slate-200 select-none font-sans">
      {/* 1. Top Compact Status & Quick Refresh Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-slate-800/70 bg-[#030712]/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 border border-cyan-400 rotate-45 flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-400" />
          </div>
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-300 uppercase">
            ENCLAVE WORKSPACE CONTROL PLANE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AIR-GAP ACTIVE
          </span>
          <button
            onClick={() => {
              loadData();
              refreshSystemMetrics();
              refreshDriveHealth();
            }}
            className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
            title="Refresh Enclave Telemetry"
            aria-label="Refresh telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Hero Workspace Content Layer */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 text-center max-w-4xl mx-auto w-full">
        {/* Readiness Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#071124]/90 border border-cyan-500/40 rounded-full text-xs text-cyan-300 font-mono mb-4 shadow-md backdrop-blur-sm">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Enclave Verified • Cryptographic Air-Gap Active • Ready</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          CITADEL COMMAND CENTER
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xs sm:text-sm text-slate-300 mt-2.5 max-w-xl leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)] font-medium">
          Isolated tactical operations platform. Execute safe toolchains, launch rootless container bays, and manage encrypted evidence volumes without host leakage.
        </p>

        {/* Host / Environment Summary Card */}
        <div className="w-full max-w-2xl mt-6 p-4 bg-[#071124]/92 border border-slate-700/80 rounded-lg shadow-2xl text-left backdrop-blur-md">
          <div className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2.5 pb-2 border-b border-slate-800/80 flex items-center justify-between">
            <span>HOST ENVIRONMENT PROFILE</span>
            <span className="text-cyan-400">RUNTIME VERIFIED</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <span className="text-slate-500 text-[10px] block">NODE HOSTNAME</span>
              <span className="text-white font-medium truncate block">{hostname}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">KERNEL & OS</span>
              <span className="text-white font-medium truncate block">Kali Linux 6.8</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">LUKS2 STORAGE</span>
              <span className="text-emerald-400 font-medium truncate block">{storageFreeGb} GB Free</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">LOCAL IP</span>
              <span className="text-cyan-300 font-medium truncate block">{ipAddress}</span>
            </div>
          </div>
        </div>

        {/* Primary & Secondary Hero Action Triggers */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-7">
          <button
            onClick={() => openPanel('projects')}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Open Projects Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={async () => {
              await createTerminalTab('Kali Shell');
              openPanel('terminal');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#071124] hover:bg-[#0a162e] border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Spawn PTY Terminal</span>
          </button>
        </div>
      </main>

      {/* 6. Floating Workspace Navigation Dock */}
      <footer className="relative z-10 p-4 sm:p-6 flex justify-center shrink-0">
        <nav
          aria-label="Workspace Quick Navigation"
          className="flex items-center flex-wrap justify-center gap-1.5 sm:gap-2 p-1.5 bg-[#050b18]/90 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md"
        >
          {NAV_SECTIONS.map((item) => {
            const Icon = item.icon;
            const isSelected = activePanel === item.id;

            return (
              <button
                key={item.id}
                ref={(el) => {
                  triggerRefs.current[item.id] = el;
                }}
                onClick={() => openPanel(item.id)}
                aria-pressed={isSelected}
                aria-label={`Open ${item.label} floating workspace panel`}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer select-none focus:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400',
                  isSelected
                    ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70 border border-transparent'
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isSelected ? 'text-cyan-400' : 'text-slate-400'
                    )}
                  />
                </div>
                <span className="whitespace-nowrap hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </footer>

      {/* 7. Reusable Floating Workspace Window */}
      {activePanel && currentNav && (
        <FloatingWorkspaceWindow
          id={`floating-panel-${activePanel}`}
          title={currentNav.label}
          sectionStatus={currentNav.status}
          statusVariant={currentNav.statusVariant}
          icon={currentNav.icon}
          isOpen={true}
          onClose={closePanel}
          triggerRef={{ current: triggerRefs.current[activePanel] || null }}
          demoDataNotice={!isNative}
          widthClass={
            activePanel === 'overview' || activePanel === 'diagnostics'
              ? 'max-w-4xl'
              : activePanel === 'projects' || activePanel === 'logs'
              ? 'max-w-4xl'
              : 'max-w-3xl'
          }
        >
          {activePanel === 'overview' && (
            <OverviewPanel
              toolchain={toolchain}
              onOpenProjects={() => setActivePanel('projects')}
              onOpenTerminal={() => setActivePanel('terminal')}
              onOpenStorage={() => setActivePanel('storage')}
            />
          )}

          {activePanel === 'projects' && (
            <ProjectsPanel
              projects={projects}
              onOpenTerminal={() => setActivePanel('terminal')}
            />
          )}

          {activePanel === 'terminal' && (
            <TerminalPanel
              onOpenTerminalDeck={() => {
                closePanel();
                setActiveModule('terminal-deck');
              }}
            />
          )}

          {activePanel === 'storage' && <StoragePanel />}

          {activePanel === 'logs' && <LogsPanel logs={auditLogs} />}

          {activePanel === 'diagnostics' && (
            <DiagnosticsPanel processes={processes} onRefresh={loadData} />
          )}

          {activePanel === 'devops' && <DevOpsPanel />}

          {activePanel === 'datalab' && <DataLabPanel />}

          {activePanel === 'settings' && <SettingsPanel />}
        </FloatingWorkspaceWindow>
      )}
    </div>
  );
};
