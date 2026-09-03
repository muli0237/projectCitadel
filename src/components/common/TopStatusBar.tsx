import React, { useEffect, useState } from 'react';
import { Shield, HardDrive, Wifi, Clock, Search, Sliders, AlertCircle } from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';
import { StatusPill } from './StatusPill';

export const TopStatusBar: React.FC = () => {
  const {
    driveHealth,
    systemMetrics,
    activeProject,
    setActiveModule,
    setCommandPaletteOpen,
    authorizationAcknowledged,
  } = useCitadelStore();

  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-[#050b18] border-b border-slate-800/80 px-4 md:px-6 flex items-center justify-between select-none z-30 shrink-0 text-slate-200 font-sans">
      {/* Zone 1: Brand title & Workspace Indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-3.5 h-3.5 border border-cyan-400 rotate-45 shrink-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-cyan-400" />
          </div>
          <span className="font-semibold text-sm tracking-wider text-white">
            CITADEL
          </span>
          <span className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider hidden sm:inline-block">
            // CYBERGUARD CORE
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden md:block" />

        {activeProject ? (
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[10px] uppercase">WORKSPACE:</span>
            <span className="text-cyan-300 font-medium truncate max-w-[200px]">
              {activeProject.name}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 bg-cyan-950 border border-cyan-500/30 text-cyan-300 rounded-xs">
              {activeProject.category}
            </span>
          </div>
        ) : (
          <span className="hidden lg:inline-block text-[11px] font-mono text-slate-400">
            ACTIVE WORKSPACE: <span className="text-white font-medium">PROJECT_XRAY_ALPHA</span>
          </span>
        )}
      </div>

      {/* Zone 2: Navigation & Search Hotkey */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#071124] hover:bg-[#0a162e] border border-slate-700/60 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer rounded-md"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Quick Search</span>
          <kbd className="px-1.5 py-0.5 bg-[#030712] border border-slate-800 text-[10px] text-cyan-400 font-mono rounded-xs">
            Ctrl+K
          </kbd>
        </button>

        {!authorizationAcknowledged && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-500/40 text-amber-400 text-xs font-mono rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase text-[10px]">Scope Unverified</span>
          </div>
        )}
      </div>

      {/* Zone 3: Hardware Indicators & Actions */}
      <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
        {/* Local IP */}
        <div className="hidden md:flex items-center gap-2 text-[10px]">
          <span className="text-slate-400 uppercase">Local IP:</span>
          <span className="text-cyan-400 font-medium tabular-nums">
            {systemMetrics?.networkInterfaces?.[0]?.ipAddresses?.[0]?.split('/')[0] || '10.0.4.15'}
          </span>
        </div>

        {/* Global Clock */}
        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-medium tabular-nums">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{timeStr || '00:00:00'}</span>
        </div>
      </div>
    </header>
  );
};
