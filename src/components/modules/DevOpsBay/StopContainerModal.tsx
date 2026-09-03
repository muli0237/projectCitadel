import React, { useState } from 'react';
import {
  Square,
  AlertTriangle,
  X,
  Clock,
  Zap,
  Terminal,
  Cpu,
  HardDrive,
} from 'lucide-react';
import { ContainerSummary } from '../../../types';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import { useCitadelStore } from '../../../store/useCitadelStore';

interface StopContainerModalProps {
  container: ContainerSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onStopped: () => void;
}

export const StopContainerModal: React.FC<StopContainerModalProps> = ({
  container,
  isOpen,
  onClose,
  onStopped,
}) => {
  const { showToast } = useCitadelStore();
  const [forceKill, setForceKill] = useState(false);
  const [stopping, setStopping] = useState(false);

  if (!isOpen || !container) return null;

  const isNative = isTauriEnvironment();
  const commandSyntax = forceKill
    ? `docker kill ${container.name}`
    : `docker stop -t 10 ${container.name}`;

  const handleConfirmStop = async () => {
    setStopping(true);
    try {
      await bridge.containerAction(container.id, 'stop');
      showToast({
        type: 'warning',
        title: forceKill ? 'Container Terminated (SIGKILL)' : 'Container Stopped (SIGTERM)',
        message: `${container.name} (${container.id}) transitioned to exited state.`,
      });
      onStopped();
      setStopping(false);
      onClose();
    } catch (err) {
      setStopping(false);
    }
  };

  const formattedPorts =
    container.ports.length > 0
      ? container.ports
          .map((p) => (typeof p === 'object' ? `${p.hostPort}:${p.containerPort}/${p.protocol}` : p))
          .join(', ')
      : 'None (isolated)';

  return (
    <div
      id="devops-stop-container-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="devops-stop-container-modal"
        className="bg-[#071126] border border-amber-500/40 rounded-md max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-500/20 bg-[#030917]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xs bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Square className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-oxanium text-white uppercase tracking-wider">
                Halt Workload // Stop Container
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">
                  Send shutdown signal to container PID
                </span>
                <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30">
                  {isNative ? 'TAURI IPC' : 'SANDBOX DAEMON'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={stopping}
            className="p-1 rounded-xs hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-slate-200">
          <div className="flex items-start gap-3 p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xs">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono space-y-1">
              <p className="text-amber-200 font-bold">
                Are you sure you want to halt this running instance?
              </p>
              <p className="text-slate-300 text-[11px]">
                Active sockets will close and in-flight TCP connections will terminate. Ephemeral files remain preserved inside the container layer until removed.
              </p>
            </div>
          </div>

          {/* Container Metadata Card */}
          <div className="bg-[#030917] border border-cyan-950 rounded-xs p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
              <span className="text-slate-400">Container Name:</span>
              <span className="text-white font-bold">{container.name}</span>
            </div>
            <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
              <span className="text-slate-400">Image:</span>
              <span className="text-cyan-400">{container.image}</span>
            </div>
            <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
              <span className="text-slate-400">Active Ports:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{formattedPorts}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Resource Ingestion:</span>
              <span className="text-slate-300">
                CPU {container.cpuUsagePercent || 0}% | {container.memoryUsageMb || 0} MB
              </span>
            </div>
          </div>

          {/* Graceful vs Force Kill Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 block">
              Shutdown Signal Strategy:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForceKill(false)}
                className={`p-2.5 rounded-xs border text-left font-mono text-xs transition-all ${
                  !forceKill
                    ? 'bg-amber-950/60 border-amber-400 text-white shadow-xs'
                    : 'bg-[#030917] border-cyan-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span>SIGTERM (Graceful)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Allows 10s for processes to cleanly flush buffers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setForceKill(true)}
                className={`p-2.5 rounded-xs border text-left font-mono text-xs transition-all ${
                  forceKill
                    ? 'bg-rose-950/60 border-rose-400 text-white shadow-xs'
                    : 'bg-[#030917] border-cyan-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>SIGKILL (Immediate)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Forces immediate process termination.
                </p>
              </button>
            </div>
          </div>

          {/* Command Preview */}
          <div className="bg-[#020612] border border-cyan-500/30 rounded-xs p-2.5 font-mono text-xs">
            <span className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-cyan-400" />
              CLI Command
            </span>
            <code className="text-amber-400 block truncate">$ {commandSyntax}</code>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-amber-500/20 bg-[#030917]/90">
          <button
            type="button"
            onClick={onClose}
            disabled={stopping}
            className="px-3.5 py-1.5 rounded-xs text-xs font-mono text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-stop-container-btn"
            type="button"
            onClick={handleConfirmStop}
            disabled={stopping}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xs text-xs font-mono font-bold uppercase transition-all shadow-xs ${
              forceKill
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)]'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(217,119,6,0.3)]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>{stopping ? 'Halting...' : forceKill ? 'Force Kill (SIGKILL)' : 'Stop Container'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
