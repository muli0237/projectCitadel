import React from 'react';
import { isTauriEnvironment, ipcTelemetry } from '../../lib/tauri';
import { formatBytes, formatTimestamp } from '../../lib/formatters';
import type { SystemSnapshot, WorkspaceStatus } from '../../types';

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: SystemSnapshot | null;
  workspaceStatus: WorkspaceStatus | null;
  isStale: boolean;
  onRefreshMetrics: () => void;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  snapshot,
  workspaceStatus,
  isStale,
  onRefreshMetrics,
}) => {
  if (!isOpen) return null;

  const isTauri = isTauriEnvironment();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs transition-opacity">
      <div
        className="w-full max-w-xl h-full bg-[#0a0f18] border-l border-cyan-900/40 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right"
        role="dialog"
        aria-label="System Diagnostics"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-cyan-900/30 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <h2 className="text-sm font-semibold tracking-wider uppercase text-cyan-200">
                  Citadel Diagnostic Console
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Runtime telemetry, IPC channel health, and hardware verification
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors focus-visible:outline-cyan-500"
              aria-label="Close diagnostic console"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Runtime Environment Badge */}
          <div className="bg-[#05080e] border border-cyan-900/20 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">Runtime Platform</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono tracking-wide ${
                  isTauri
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                }`}
              >
                {isTauri ? 'Native Desktop (Tauri 2.x / Rust)' : 'Web Preview / Browser Bridge'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-500 block">Host Name</span>
                <span className="font-mono text-slate-200">{snapshot?.hostname || 'Unavailable'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Operating System</span>
                <span className="font-mono text-slate-200">{snapshot?.osName || 'Linux'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kernel Version</span>
                <span className="font-mono text-slate-200">{snapshot?.kernelVersion || 'Unavailable'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kali Linux Detected</span>
                <span className="font-mono text-slate-200">{snapshot?.isKaliLinux ? 'Yes (Verified)' : 'Generic Linux / Host'}</span>
              </div>
            </div>
          </div>

          {/* IPC & Channel Health */}
          <div className="bg-[#05080e] border border-cyan-900/20 rounded p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">IPC Channel Metrics</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono ${
                  isStale
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800/40'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {isStale ? 'METRICS STALE' : 'LIVE TELEMETRY'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Total IPC Invocations</span>
                <span className="font-mono text-slate-200">{ipcTelemetry.totalCalls}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Channel Call</span>
                <span className="font-mono text-slate-200">{ipcTelemetry.lastCallName || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IPC Latency</span>
                <span className="font-mono text-slate-200">
                  {ipcTelemetry.lastCallLatencyMs !== null ? `${ipcTelemetry.lastCallLatencyMs} ms` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Timestamp</span>
                <span className="font-mono text-slate-200">
                  {formatTimestamp(ipcTelemetry.lastCallTimestamp || snapshot?.collectedAt)}
                </span>
              </div>
            </div>

            {ipcTelemetry.lastError && (
              <div className="mt-2 p-2.5 rounded bg-red-950/30 border border-red-900/40 text-xs text-red-300 font-mono break-all">
                Last Error: {ipcTelemetry.lastError}
              </div>
            )}
          </div>

          {/* Portable Workspace State */}
          <div className="bg-[#05080e] border border-cyan-900/20 rounded p-4 space-y-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono block">
              Portable Workspace Subsystem
            </span>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block">Resolved Storage Root</span>
                <span className="font-mono text-cyan-300 break-all">{workspaceStatus?.rootPath || 'Detecting...'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-slate-500 block">Writable Status</span>
                  <span className="font-mono text-slate-200">{workspaceStatus?.isWritable ? 'Read-Write (OK)' : 'Read-Only'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Database Vault</span>
                  <span className="font-mono text-slate-200">
                    {workspaceStatus?.databaseIntegrityOk ? 'SQLite WAL (Verified)' : 'Corrupted / Inactive'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Available Storage</span>
                  <span className="font-mono text-slate-200">
                    {workspaceStatus ? formatBytes(workspaceStatus.freeSpaceBytes) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Projects / Notes</span>
                  <span className="font-mono text-slate-200">
                    {workspaceStatus?.projectCount ?? 0} Proj / {workspaceStatus?.noteCount ?? 0} Notes
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-6 border-t border-cyan-900/30 flex items-center justify-between">
          <button
            onClick={onRefreshMetrics}
            className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-200 rounded text-xs font-mono font-medium tracking-wide flex items-center space-x-1.5 transition-colors focus-visible:outline-cyan-500"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>Force Telemetry Sync</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono transition-colors focus-visible:outline-cyan-500"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
