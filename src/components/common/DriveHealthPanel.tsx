import React, { useState } from 'react';
import { HardDrive, ShieldCheck, RefreshCw, Lock, Unlock, LogOut } from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';
import { StatusPill } from './StatusPill';

export const DriveHealthPanel: React.FC = () => {
  const { driveHealth, workspace, triggerSafeEject, simulateDriveReconnect } = useCitadelStore();
  const [ejecting, setEjecting] = useState(false);

  if (!driveHealth) return null;

  const usedGb = (driveHealth.usedBytes / (1024 * 1024 * 1024)).toFixed(1);
  const totalGb = (driveHealth.totalBytes / (1024 * 1024 * 1024)).toFixed(1);
  const freeGb = (driveHealth.freeBytes / (1024 * 1024 * 1024)).toFixed(1);

  const handleEject = async () => {
    setEjecting(true);
    await triggerSafeEject();
    setEjecting(false);
  };

  return (
    <div className="bg-[#0D0D0F] border border-[#1F1F21] p-4 sm:p-5 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#1F1F21]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#161618] border border-[#1F1F21] text-cyan-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Citadel Portable Storage Engine
              </h3>
              <StatusPill
                status={driveHealth.isReadOnly ? 'warning' : 'healthy'}
                label={driveHealth.isReadOnly ? 'READ ONLY' : 'WRITABLE'}
                pulse={!driveHealth.isReadOnly}
              />
            </div>
            <p className="text-[10px] text-[#4F4F52] font-mono mt-0.5 truncate max-w-md">
              {driveHealth.deviceName} → {driveHealth.mountPoint}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {driveHealth.unmountPending ? (
            <button
              onClick={() => simulateDriveReconnect()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161618] border border-emerald-500/40 text-emerald-400 text-xs font-mono hover:bg-[#1A1A1C] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Remount Storage
            </button>
          ) : (
            <button
              onClick={handleEject}
              disabled={ejecting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161618] border border-[#1F1F21] text-[#6B6B6D] hover:text-rose-400 hover:border-rose-900 text-xs font-mono transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              {ejecting ? 'Flushing DB...' : 'Prepare Safe Eject'}
            </button>
          )}
        </div>
      </div>

      {/* Storage Capacity Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div className="md:col-span-2">
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-[#6B6B6D]">Capacity Utilization</span>
            <span className="text-cyan-400 font-bold">{driveHealth.usagePercentage}% ({usedGb} GB / {totalGb} GB)</span>
          </div>
          <div className="w-full bg-[#161618] h-1.5 overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${driveHealth.usagePercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[#4F4F52] font-mono mt-1.5">
            <span>Free Space: {freeGb} GB</span>
            <span>FS: {driveHealth.filesystem} (Atomic Sync)</span>
          </div>
        </div>

        <div className="bg-[#161618] border border-[#1F1F21] p-3 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6D] uppercase">
            <span>Storage Health</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-500 mt-1">
            {driveHealth.estimatedWearLevel}% Optimal
          </div>
          <div className="text-[9px] text-[#4F4F52] font-mono truncate mt-0.5">
            Atomic WAL Journaling Active
          </div>
        </div>

        <div className="bg-[#161618] border border-[#1F1F21] p-3 flex flex-col justify-center">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6B6D] uppercase">
            <span>Workspace Lock</span>
            {workspace?.lockActive ? (
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-amber-400" />
            )}
          </div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-1">
            PID {workspace?.lockOwnerPid || '28419'}
          </div>
          <div className="text-[9px] text-[#4F4F52] font-mono truncate mt-0.5">
            Exclusive Process Lock Held
          </div>
        </div>
      </div>
    </div>
  );
};
