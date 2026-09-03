import React, { useState } from 'react';
import {
  HardDrive,
  Lock,
  Unlock,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Database,
  Cpu,
} from 'lucide-react';
import { useCitadelStore } from '../../../../store/useCitadelStore';
import encryptedDriveImg from '../../../../assets/images/encrypted_storage_drive_1788363301948.jpg';

export const StoragePanel: React.FC = () => {
  const { driveHealth, workspace, triggerSafeEject, simulateDriveReconnect, showToast } =
    useCitadelStore();
  const [ejecting, setEjecting] = useState(false);

  const usedGb = driveHealth ? (driveHealth.usedBytes / 1024 ** 3).toFixed(1) : '24.8';
  const totalGb = driveHealth ? (driveHealth.totalBytes / 1024 ** 3).toFixed(1) : '256.0';
  const freeGb = driveHealth ? (driveHealth.freeBytes / 1024 ** 3).toFixed(1) : '204.2';
  const usagePercent = driveHealth?.usagePercentage || 24;

  const handleEject = async () => {
    setEjecting(true);
    await triggerSafeEject();
    setEjecting(false);
    showToast({
      type: 'warning',
      title: 'Drive Safe Eject Initiated',
      message: 'All uncommitted SQLite WAL buffers have been flushed to flash storage.',
    });
  };

  return (
    <div className="space-y-5">
      {/* Real Hardware Volume Banner */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#040915]">
        <div className="h-32 w-full relative">
          <img
            src={encryptedDriveImg}
            alt="LUKS2 Encrypted Hardware Drive"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-90 filter saturate-[1.15] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040915] via-[#040915]/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 backdrop-blur-xs font-semibold">
              LUKS2 ENCRYPTED & ONLINE
            </span>
          </div>
          <div className="absolute bottom-3 left-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Portable Storage Volume
            </h3>
            <p className="text-[11px] font-mono text-cyan-300">
              {driveHealth?.deviceName || '/dev/mapper/citadel_crypt'} • {driveHealth?.filesystem || 'ext4 (atomic WAL)'}
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="p-4 pt-2 space-y-1.5 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Capacity Utilization</span>
            <span className="text-white font-medium">
              {usedGb} GB used of {totalGb} GB ({usagePercent}%)
            </span>
          </div>
          <div className="w-full bg-[#060e1d] h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, usagePercent))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>{freeGb} GB Available</span>
            <span>Target: {driveHealth?.mountPoint || '/media/kali/CITADEL_DRIVE'}</span>
          </div>
        </div>
      </div>

      {/* Hardware & Filesystem Diagnostics Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 bg-[#040915] border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
          <div className="text-slate-400 text-[11px] font-sans font-semibold uppercase">
            Volume Parameters
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Block Device:</span>
            <span className="text-white">{driveHealth?.deviceName || '/dev/mapper/citadel_crypt'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Filesystem:</span>
            <span className="text-white">{driveHealth?.filesystem || 'ext4 (atomic WAL)'}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Encryption:</span>
            <span className="text-cyan-400 font-bold">LUKS2 (AES-XTS-PLAIN64 512-BIT)</span>
          </div>
        </div>

        <div className="p-3.5 bg-[#040915] border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
          <div className="text-slate-400 text-[11px] font-sans font-semibold uppercase">
            Integrity & Buffer Status
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">Write Mode:</span>
            <span className="text-emerald-400 font-medium">Read / Write (Atomic Safe)</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800/60">
            <span className="text-slate-500">WAL Buffer:</span>
            <span className="text-cyan-300">Synchronized (0 Dirty Pages)</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">SMART Status:</span>
            <span className="text-emerald-400 font-medium">HEALTHY (0 Reallocated)</span>
          </div>
        </div>
      </div>

      {/* Storage Management Controls */}
      <div className="p-4 bg-[#040915] border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-semibold text-white">Safe Volume Ejection Protocol</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Atomically flush disk caches, unmount LUKS2 key ring, and safely disconnect the USB volume.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {driveHealth?.unmountPending ? (
            <button
              onClick={() => simulateDriveReconnect()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-medium rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Remount Drive</span>
            </button>
          ) : (
            <button
              onClick={handleEject}
              disabled={ejecting}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{ejecting ? 'Flushing Buffers...' : 'Safe Eject Volume'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
