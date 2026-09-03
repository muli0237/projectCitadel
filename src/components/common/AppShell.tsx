import React from 'react';
import { useCitadelStore } from '../../store/useCitadelStore';
import { LaunchExperience } from '../launch/LaunchExperience';
import { TopStatusBar } from './TopStatusBar';
import { AuthorizationBanner } from './AuthorizationBanner';
import { CommandRail } from './CommandRail';
import { ToastContainer } from './ToastContainer';
import { ConfirmationDialog } from './ConfirmationDialog';
import { CommandPreviewModal } from './CommandPreviewModal';
import { EmergencyDriveModal } from './EmergencyDriveModal';
import { CommandPalette } from './CommandPalette';
import { OperationsBackdrop } from './OperationsBackdrop';

// Module Components
import { CommandCenter } from '../modules/CommandCenter/CommandCenter';
import { WorkspaceModule } from '../modules/Workspace/WorkspaceModule';
import { TerminalDeck } from '../modules/TerminalDeck/TerminalDeck';
import { ToolboxModule } from '../modules/Toolbox/ToolboxModule';
import { DevOpsBay } from '../modules/DevOpsBay/DevOpsBay';
import { CodeLab } from '../modules/CodeLab/CodeLab';
import { DataLab } from '../modules/DataLab/DataLab';
import { SystemMonitor } from '../modules/SystemMonitor/SystemMonitor';
import { NotesRunbooks } from '../modules/NotesRunbooks/NotesRunbooks';
import { SettingsModule } from '../modules/Settings/SettingsModule';

export const AppShell: React.FC = () => {
  const {
    activeModule,
    launchSequenceComplete,
    completeLaunchSequence,
    refreshWorkspace,
    refreshDriveHealth,
    refreshSystemMetrics,
    refreshProjects,
  } = useCitadelStore();

  React.useEffect(() => {
    refreshWorkspace();
    refreshDriveHealth();
    refreshSystemMetrics();
    refreshProjects();

    const interval = setInterval(() => {
      refreshDriveHealth();
      refreshSystemMetrics();
    }, 5000);

    return () => clearInterval(interval);
  }, [refreshDriveHealth, refreshProjects, refreshSystemMetrics, refreshWorkspace]);

  if (!launchSequenceComplete) {
    return <LaunchExperience onComplete={completeLaunchSequence} totalDurationSeconds={6.0} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'command-center':
        return <CommandCenter />;
      case 'workspace':
        return <WorkspaceModule />;
      case 'terminal-deck':
        return <TerminalDeck />;
      case 'toolbox':
        return <ToolboxModule />;
      case 'devops-bay':
        return <DevOpsBay />;
      case 'code-lab':
        return <CodeLab />;
      case 'data-lab':
        return <DataLab />;
      case 'system-monitor':
        return <SystemMonitor />;
      case 'notes-runbooks':
        return <NotesRunbooks />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#030712] text-slate-200 overflow-hidden select-none relative font-sans">
      {/* Global Top Status Bar */}
      <TopStatusBar />

      {/* Mandatory Rules of Engagement / Authorization Notice Banner */}
      <AuthorizationBanner />

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Consistent Tactical Command Center Operations Backdrop */}
        <OperationsBackdrop />

        {/* Left Side Command Rail Navigation */}
        <CommandRail />

        {/* Active Module Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden bg-transparent relative z-10">
          {renderModule()}
        </main>
      </div>

      {/* Global Hardware & Kernel Footer Bar */}
      <footer className="h-8 bg-[#050b18] border-t border-slate-800/80 flex items-center justify-between px-4 lg:px-6 text-[10px] font-mono text-slate-400 select-none shrink-0 z-20">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <span>SYSTEM: KALI GNU/LINUX ROLLING</span>
          <span className="hidden sm:inline">KERNEL: 6.8.0-KALI-AMD64</span>
          <span className="hidden md:inline">DRV_FS: EXT4 (ENCRYPTED / ATOMIC WAL)</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5 uppercase text-slate-400">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <span>BACKEND SYNC STABLE</span>
          </span>
        </div>
      </footer>

      {/* Modals, Overlays & Notifications */}
      <CommandPalette />
      <CommandPreviewModal />
      <ConfirmationDialog />
      <EmergencyDriveModal />
      <ToastContainer />
    </div>
  );
};
