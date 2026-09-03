import React from 'react';
import { AlertOctagon, RefreshCw, HardDrive, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';

export const EmergencyDriveModal: React.FC = () => {
  const { emergencyDriveModalOpen, simulateDriveReconnect, workspace } = useCitadelStore();

  if (!emergencyDriveModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in font-sans">
      <div className="bg-[#071124] border border-rose-600/70 max-w-lg w-full p-6 rounded-lg shadow-2xl relative">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-rose-300">
              Storage Disconnect Emergency State
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Portable drive IO heartbeat lost. Active disk writes halted.
            </p>
          </div>
        </div>

        <div className="my-5 space-y-3.5 text-xs">
          <div className="bg-[#040915] border border-rose-950/60 rounded-md p-3.5 text-slate-300 leading-relaxed">
            Citadel workspace drive (<code className="text-rose-400 font-mono">/media/kali/CITADEL_DRIVE</code>) is no longer available.
            To prevent database corruption and data loss on your flash drive, SQLite transaction memory buffers have been locked in volatile memory.
          </div>

          <div className="border border-slate-800 p-3.5 bg-[#040915] rounded-md space-y-2 font-mono text-xs">
            <div className="text-rose-400 font-medium text-[11px] uppercase">Recovery Diagnostics:</div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Memory Lock Status:</span>
              <span className="text-emerald-400">HELD SAFE IN RAM</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Uncommitted Audit Records:</span>
              <span className="text-amber-400">Buffered</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Workspace Path:</span>
              <span className="text-white truncate max-w-[200px]">{workspace?.rootPath}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => simulateDriveReconnect()}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs rounded-md transition-colors w-full justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reconnect & Resume Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
