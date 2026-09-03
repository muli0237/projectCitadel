import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  HardDrive,
  Terminal,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  FileCode,
  Volume2,
  Eye,
  Sliders,
  Database,
  Lock,
  Activity,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge } from '../../../services/tauriBridge';
import { AppSettings, AuditEntry } from '../../../types';
import { StatusPill } from '../../common/StatusPill';
import { DiagnosticsDrawer } from '../../common/DiagnosticsDrawer';
import { useSystemMetrics } from '../../../hooks/useSystemMetrics';

export const SettingsModule: React.FC = () => {
  const { settings, updateSettings, replayLaunchSequence, showToast, showConfirmation, workspace } = useCitadelStore();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'terminal' | 'audit' | 'privacy'>('general');
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const { snapshot, isStale, refetch } = useSystemMetrics({ activeModule: 'settings' });

  useEffect(() => {
    setFormData(settings);
    loadAudit();
  }, [settings]);

  const loadAudit = async () => {
    const logs = await bridge.getAuditLogs();
    setAuditEntries(logs);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSettings(formData);
  };

  const handleExportBackup = () => {
    const backupJson = JSON.stringify(
      {
        citadel_version: '2.4.0',
        timestamp: new Date().toISOString(),
        settings: formData,
        auditLogs: auditEntries,
      },
      null,
      2
    );

    const blob = new Blob([backupJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citadel_workspace_backup_${Date.now()}.json`;
    a.click();
    showToast({
      type: 'success',
      title: 'Workspace Backup Exported',
      message: 'Archive saved to portable storage export directory.',
    });
  };

  const handleWipeMetadata = () => {
    showConfirmation({
      title: 'Wipe Local Citadel Metadata?',
      message: 'This will reset all application preferences, recent item caches, and local audit logs. Project repository files on the flash drive will not be affected.',
      confirmLabel: 'Wipe Metadata',
      isDestructive: true,
      onConfirm: async () => {
        localStorage.clear();
        showToast({
          type: 'warning',
          title: 'Metadata Wiped',
          message: 'Citadel local metadata cleared cleanly.',
        });
      },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent text-slate-200 relative">
      <div className="relative z-10 space-y-6">
        {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1017]/90 border border-gray-800/80 rounded-md p-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xs bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="citadel-heading text-base font-semibold font-display text-gray-100 uppercase tracking-[0.12em]">
                Citadel Settings & Privacy Plane
              </h1>
              <StatusPill status="locked" label="LOCAL STORAGE ENCRYPTED" />
            </div>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              Portable configuration stored under <code className="font-terminal text-cyan-400">/media/kali/CITADEL_DRIVE/Citadel/workspace/config</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDiagnosticsOpen(true)}
            className="citadel-btn-text flex items-center gap-1.5 px-3 py-2 rounded-xs bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 text-xs font-display font-semibold tracking-[0.14em] uppercase transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Diagnostics Panel
          </button>

          <button
            onClick={handleExportBackup}
            className="citadel-btn-text flex items-center gap-1.5 px-3 py-2 rounded-xs bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-200 text-xs font-display font-semibold tracking-[0.14em] uppercase transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Backup
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition-colors ${
            activeTab === 'general'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          General & Storage
        </button>
        <button
          onClick={() => setActiveTab('terminal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition-colors ${
            activeTab === 'terminal'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Terminal & Toolpaths
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition-colors ${
            activeTab === 'audit'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Audit Logs ({auditEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-1.5 rounded-lg text-xs font-tech font-bold transition-colors ${
            activeTab === 'privacy'
              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Privacy & Zero-Telemetry
        </button>
      </div>

      {/* Tab 1: General & Storage Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="bg-[#10141d] border border-gray-800/80 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tech">
            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1">
                Portable Workspace Root Path
              </label>
              <input
                type="text"
                value={formData.workspaceRoot}
                onChange={(e) => setFormData({ ...formData, workspaceRoot: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-gray-700 text-gray-100 font-mono text-xs focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1">
                Preferred Code Editor Command
              </label>
              <select
                value={formData.preferredEditorCommand}
                onChange={(e) => setFormData({ ...formData, preferredEditorCommand: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-gray-700 text-gray-100 focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="code">VS Code (code)</option>
                <option value="codium">VSCodium (codium)</option>
                <option value="nvim">Neovim (nvim)</option>
                <option value="zed">Zed (zed)</option>
                <option value="nano">GNU Nano (nano)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1">
                Container Runtime Daemon
              </label>
              <select
                value={formData.containerRuntimePreference}
                onChange={(e) => setFormData({ ...formData, containerRuntimePreference: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-gray-700 text-gray-100 focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="docker">Docker Daemon (/var/run/docker.sock)</option>
                <option value="podman">Podman Rootless Engine</option>
                <option value="auto">Auto-detect Runtime</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1">
                Aesthetic UI Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-gray-700 text-gray-100 focus:border-cyan-400 focus:outline-hidden"
              >
                <option value="graphite-cyan">Tactical Graphite & Electric Cyan</option>
                <option value="graphite-amber">Ops Graphite & Amber Status</option>
                <option value="graphite-emerald">SecOps Emerald & Titanium</option>
                <option value="pure-dark">Air-Gapped Pure Dark</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-800">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-tech text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.playTacticalAudio}
                  onChange={(e) => setFormData({ ...formData, playTacticalAudio: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <span>Synthesized Tactical Audio Feedback</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-tech text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enableMotion}
                  onChange={(e) => setFormData({ ...formData, enableMotion: e.target.checked })}
                  className="rounded bg-gray-900 border-gray-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                <span>Enable Mechanical Launch Sequence</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={replayLaunchSequence}
                className="px-3.5 py-2 rounded-lg bg-[#161618] hover:bg-[#1f2937] border border-[#1F1F21] text-[#39d9ff] font-tech text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Replay Launch Experience
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Terminal Preferences */}
      {activeTab === 'terminal' && (
        <form onSubmit={handleSave} className="bg-[#10141d] border border-gray-800/80 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tech">
            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1">
                Terminal Font Size (px)
              </label>
              <input
                type="number"
                min={10}
                max={24}
                value={formData.terminalFontSize}
                onChange={(e) => setFormData({ ...formData, terminalFontSize: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-gray-700 text-gray-100 font-mono text-xs focus:border-cyan-400 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-400 uppercase text-[10px] mb-1">
                Terminal Monospace Font Family
              </label>
              <input
                type="text"
                value={formData.terminalFontFamily}
                onChange={(e) => setFormData({ ...formData, terminalFontFamily: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0e14] border border-gray-700 text-gray-100 font-mono text-xs focus:border-cyan-400 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end border-t border-gray-800">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Save Terminal Settings
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-[#10141d] border border-gray-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800 text-xs font-tech">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-gray-200 font-bold uppercase">Immutable Local Audit Trail</span>
            </div>
            <span className="text-gray-400 font-mono">Retention: {formData.auditLogRetentionDays} Days</span>
          </div>

          <div className="divide-y divide-gray-800/60 max-h-96 overflow-y-auto">
            {auditEntries.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-4 text-xs font-tech">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300 font-mono">{log.actionType}</span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-gray-300 font-mono text-[11px] mt-0.5 leading-relaxed">
                    {log.details}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                      log.severity === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300'
                        : log.severity === 'WARN'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {log.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Privacy & Safety Zero-Telemetry Explanation */}
      {activeTab === 'privacy' && (
        <div className="bg-[#10141d] border border-gray-800/80 rounded-xl p-6 space-y-4 text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-tech text-gray-100 uppercase tracking-wider">
                Citadel Zero-Telemetry & Local Security Policy
              </h3>
              <p className="text-gray-400 font-sans mt-0.5">
                Complete transparency on what data Citadel stores and how it stays isolated.
              </p>
            </div>
          </div>

          <div className="space-y-3 font-sans text-gray-300 leading-relaxed">
            <div className="p-3.5 rounded-lg bg-[#0b0e14] border border-gray-800">
              <h4 className="font-tech font-bold text-gray-100 uppercase text-[11px] mb-1">
                1. 100% Air-Gapped Local-First Architecture
              </h4>
              <p>
                Citadel makes zero outbound analytics, crash report, or telemetry calls. All database state, tool configurations, notes, and session logs reside strictly in your flash drive workspace directory.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#0b0e14] border border-gray-800">
              <h4 className="font-tech font-bold text-gray-100 uppercase text-[11px] mb-1">
                2. Host Isolation
              </h4>
              <p>
                Citadel avoids writing state to <code className="text-cyan-400 font-mono">~/.config</code> or <code className="text-cyan-400 font-mono">~/.local/share</code> on the host machine, keeping all artifacts on the removable drive.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-gray-500 font-tech text-[11px]">
              Ready to reset this flash drive's Citadel metadata?
            </span>
            <button
              onClick={handleWipeMetadata}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 font-tech font-bold text-xs hover:bg-rose-900/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wipe Local Metadata
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Diagnostics Inspection Drawer */}
      <DiagnosticsDrawer
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        snapshot={snapshot}
        workspaceStatus={workspace}
        isStale={isStale}
        onRefreshMetrics={refetch}
      />
    </div>
  );
};
