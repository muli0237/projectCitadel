import React from 'react';
import {
  Terminal,
  Plus,
  Play,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
  Cpu,
  Monitor,
} from 'lucide-react';
import { useCitadelStore } from '../../../../store/useCitadelStore';
import terminalHudImg from '../../../../assets/images/kali_terminal_hud_1788363317521.jpg';

interface TerminalPanelProps {
  onOpenTerminalDeck: () => void;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ onOpenTerminalDeck }) => {
  const { terminalTabs, activeTerminalId, createTerminalTab, setActiveTerminalId, showToast } =
    useCitadelStore();

  const handleSpawn = async (profile: 'Kali Shell' | 'Sandbox Shell' | 'Git Environment') => {
    const id = await createTerminalTab(profile);
    if (id) {
      showToast({
        type: 'success',
        title: `Terminal Spawned: ${profile}`,
        message: `PTY session ID ${id.slice(0, 8)} initialized`,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Real Terminal HUD Banner */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#040915]">
        <div className="h-28 w-full relative">
          <img
            src={terminalHudImg}
            alt="Kali Tactical Terminal HUD"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-85 filter saturate-[1.15] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040915] via-[#040915]/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold backdrop-blur-xs">
              PTY ENGINE READY
            </span>
          </div>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Tactical Terminal Subsystem
            </h3>
            <p className="text-[11px] font-mono text-cyan-300">
              VT100 / Xterm-256color • Rootless Isolated Shells
            </p>
          </div>
        </div>
      </div>

      {/* Top Profile Spawner */}
      <div className="bg-[#040915] border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-white tracking-wide">
              Spawn New Pseudo-Terminal (PTY)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">HOST PTY READY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => handleSpawn('Kali Shell')}
            className="p-3 bg-[#060e1d] hover:bg-[#081329] border border-slate-800 hover:border-cyan-500/40 rounded-md text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white">Kali Root PTY</span>
              <Play className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] font-mono text-slate-400">/usr/bin/zsh • Root Context</div>
          </button>

          <button
            onClick={() => handleSpawn('Sandbox Shell')}
            className="p-3 bg-[#060e1d] hover:bg-[#081329] border border-slate-800 hover:border-cyan-500/40 rounded-md text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white">Sandbox Session</span>
              <Play className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] font-mono text-slate-400">Isolated Workspace Root</div>
          </button>

          <button
            onClick={() => handleSpawn('Git Environment')}
            className="p-3 bg-[#060e1d] hover:bg-[#081329] border border-slate-800 hover:border-cyan-500/40 rounded-md text-left transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white">Git Workspace</span>
              <Play className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-[10px] font-mono text-slate-400">Repo Directory Hook</div>
          </button>
        </div>
      </div>

      {/* Active PTY Sessions List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-slate-300">Active Terminal Tabs & Sessions</h4>
          <span className="text-[10px] font-mono text-slate-400">
            {terminalTabs.length} Active {terminalTabs.length === 1 ? 'Tab' : 'Tabs'}
          </span>
        </div>

        <div className="space-y-2">
          {terminalTabs.length > 0 ? (
            terminalTabs.map((tab) => {
              const isActive = tab.id === activeTerminalId;
              return (
                <div
                  key={tab.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    isActive
                      ? 'bg-[#081329] border-cyan-500/40'
                      : 'bg-[#040915] border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded bg-[#060e1d] border border-slate-700/60 text-cyan-400">
                      <Terminal className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-white truncate">{tab.title}</span>
                        {isActive && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                            FOCUSED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        Profile: {tab.profile} • CWD: {tab.workingDirectory || '/media/kali/CITADEL_DRIVE'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveTerminalId(tab.id)}
                      className="px-2.5 py-1 bg-[#060e1d] hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded transition-colors cursor-pointer"
                    >
                      Focus
                    </button>
                    <button
                      onClick={onOpenTerminalDeck}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs rounded transition-colors cursor-pointer"
                    >
                      <span>Open Deck</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 bg-[#040915] border border-slate-800 rounded-lg text-center text-slate-400 text-xs font-mono">
              No active terminal tabs. Spawn a session above to open an interactive terminal.
            </div>
          )}
        </div>
      </div>

      {/* PTY Runtime Features Notice */}
      <div className="p-3 bg-[#040915] border border-slate-800/80 rounded-lg flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Encoding: UTF-8 • ANSI Colors • Xterm-256color</span>
        <button
          onClick={onOpenTerminalDeck}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
        >
          <span>Full Terminal Deck Module</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
