import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  Terminal,
  Wrench,
  Container,
  GitBranch,
  BarChart3,
  Cpu,
  FileText,
  Settings,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useCitadelStore } from '../../store/useCitadelStore';
import { ModuleId } from '../../types';

interface NavItem {
  id: ModuleId;
  label: string;
  indexStr: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'command-center', label: 'Command Center', indexStr: '01', icon: LayoutDashboard },
  { id: 'workspace', label: 'Workspace', indexStr: '02', icon: FolderGit2 },
  { id: 'terminal-deck', label: 'Terminal Deck', indexStr: '03', icon: Terminal, badge: 'PTY' },
  { id: 'toolbox', label: 'Toolbox', indexStr: '04', icon: Wrench },
  { id: 'devops-bay', label: 'DevOps Bay', indexStr: '05', icon: Container },
  { id: 'code-lab', label: 'Code Lab', indexStr: '06', icon: GitBranch },
  { id: 'data-lab', label: 'Data Lab', indexStr: '07', icon: BarChart3 },
  { id: 'system-monitor', label: 'System Monitor', indexStr: '08', icon: Cpu },
  { id: 'notes-runbooks', label: 'Notes & Runbooks', indexStr: '09', icon: FileText },
  { id: 'settings', label: 'Settings & Privacy', indexStr: '10', icon: Settings },
];

export const CommandRail: React.FC = () => {
  const { activeModule, setActiveModule, driveHealth } = useCitadelStore();

  return (
    <aside className="w-16 lg:w-56 h-full bg-[#050b18]/92 border-r border-slate-800/80 backdrop-blur-md flex flex-col justify-between select-none shrink-0 z-20 font-sans">
      {/* Brand Header */}
      <div>
        <div className="p-4 lg:p-5 border-b border-slate-800/80 mb-2 hidden lg:block">
          <div className="flex items-center space-x-2 text-cyan-400">
            <div className="w-3.5 h-3.5 border border-cyan-400 rotate-45 shrink-0" />
            <span className="font-semibold tracking-wider text-sm text-white">CITADEL</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase">Cyberguard Enclave</p>
        </div>

        {/* Navigation list */}
        <nav className="space-y-0.5 px-1.5 lg:px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left group cursor-pointer rounded-md text-xs',
                  isActive
                    ? 'bg-[#0a162e] border-l-2 border-cyan-400 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-l-2 border-transparent'
                )}
                title={item.label}
              >
                <Icon
                  className={clsx(
                    'w-4 h-4 shrink-0 transition-colors',
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  )}
                />

                <span className="hidden lg:inline-flex items-center gap-1.5 truncate flex-1">
                  <span className="text-[10px] font-mono text-slate-500">{item.indexStr}</span>
                  <span className="truncate">{item.label}</span>
                </span>

                {item.badge && (
                  <span className="hidden lg:inline-block px-1.5 py-0.2 text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 rounded-xs">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Portable Storage Status Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#030712]">
        <div className="hidden lg:block">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 text-slate-400 uppercase">
            <span>PORTABLE_DRIVE</span>
            <span className="text-emerald-400 font-medium">HEALTHY</span>
          </div>
          <div className="w-full bg-[#071124] h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-500"
              style={{ width: `${driveHealth?.usagePercentage || 65}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-mono">
            <span className="truncate max-w-[100px]">{driveHealth?.mountPoint || '/mnt/usb_citadel'}</span>
            <span className="text-slate-200 font-medium tabular-nums">{driveHealth ? `${(driveHealth.freeBytes / (1024 ** 3)).toFixed(1)} GB Free` : '204.2 GB Free'}</span>
          </div>
        </div>

        <div className="lg:hidden flex justify-center py-1">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
        </div>
      </div>
    </aside>
  );
};
