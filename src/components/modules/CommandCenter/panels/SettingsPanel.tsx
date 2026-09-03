import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Download,
  CheckCircle2,
  Lock,
  Volume2,
  Terminal,
  Eye,
} from 'lucide-react';
import { useCitadelStore } from '../../../../store/useCitadelStore';
import { AppSettings } from '../../../../types';

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings, showToast, workspace } = useCitadelStore();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings(formData);
    setSaving(false);
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Workspace configurations successfully updated in storage.',
    });
  };

  const handleExportBackup = () => {
    const backupJson = JSON.stringify(
      {
        citadel_version: '2.4.0',
        timestamp: new Date().toISOString(),
        settings: formData,
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
      title: 'Backup Exported',
      message: 'Citadel settings backup saved to file',
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* General Settings */}
      <div className="bg-[#040915] border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-white">Workspace Configuration</h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">ENCLAVE DEFAULTS</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Workspace Root Directory:
            </label>
            <input
              type="text"
              value={formData.workspaceRoot}
              onChange={(e) =>
                setFormData({ ...formData, workspaceRoot: e.target.value })
              }
              className="w-full bg-[#060e1d] border border-slate-700/80 rounded-md px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Preferred Code Editor Command:
              </label>
              <input
                type="text"
                value={formData.preferredEditorCommand}
                onChange={(e) =>
                  setFormData({ ...formData, preferredEditorCommand: e.target.value })
                }
                className="w-full bg-[#060e1d] border border-slate-700/80 rounded-md px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Container Runtime:
              </label>
              <select
                value={formData.containerRuntimePreference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    containerRuntimePreference: e.target.value as 'docker' | 'podman',
                  })
                }
                className="w-full bg-[#060e1d] border border-slate-700/80 rounded-md px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-500/60 cursor-pointer"
              >
                <option value="docker">Docker Daemon</option>
                <option value="podman">Podman (Rootless Socket)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Air-Gap Enforcement */}
      <div className="bg-[#040915] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-white">Privacy & Air-Gap Enclave</h4>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
            AIR-GAP ACTIVE
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center gap-2.5 cursor-pointer p-2 bg-[#060e1d] rounded-md border border-slate-800/60">
            <input
              type="checkbox"
              checked={formData.safeEjectAutoFlush}
              onChange={(e) =>
                setFormData({ ...formData, safeEjectAutoFlush: e.target.checked })
              }
              className="rounded text-cyan-500 focus:ring-cyan-500/40 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-300">
              Auto-flush SQLite WAL buffers before volume unmount
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer p-2 bg-[#060e1d] rounded-md border border-slate-800/60">
            <input
              type="checkbox"
              checked={formData.playTacticalAudio}
              onChange={(e) =>
                setFormData({ ...formData, playTacticalAudio: e.target.checked })
              }
              className="rounded text-cyan-500 focus:ring-cyan-500/40 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-300">Play tactile audio feedback for commands</span>
          </label>
        </div>
      </div>

      {/* Bottom Save & Export Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleExportBackup}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#060e1d] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Backup JSON</span>
        </button>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded-md transition-colors cursor-pointer shadow-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : 'Apply Changes'}</span>
        </button>
      </div>
    </form>
  );
};
