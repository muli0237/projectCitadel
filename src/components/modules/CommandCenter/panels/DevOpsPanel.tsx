import React from 'react';
import {
  Container,
  AlertTriangle,
  Layers,
  Terminal,
  Server,
  HelpCircle,
} from 'lucide-react';

export const DevOpsPanel: React.FC = () => {
  return (
    <div className="space-y-5">
      {/* Unavailable State Hero Banner */}
      <div className="bg-[#040915] border border-amber-500/30 rounded-lg p-5">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">
                DevOps Container Runtime Daemon Offline
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                UNAVAILABLE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              The local Podman/Docker UNIX socket (<code className="text-cyan-300 font-mono">unix:///run/user/1000/podman.sock</code>) is not connected in the current air-gapped web preview.
            </p>
          </div>
        </div>
      </div>

      {/* Activation Requirements */}
      <div className="bg-[#040915] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Requirements to Activate Container Bay</span>
        </div>

        <div className="space-y-2 text-xs text-slate-400">
          <div className="p-3 bg-[#060e1d] border border-slate-800/80 rounded-md">
            <span className="font-semibold text-slate-200">1. Start rootless daemon:</span>
            <pre className="text-[11px] font-mono text-cyan-300 bg-[#030712] p-2 rounded mt-1 border border-slate-900">
              systemctl --user start podman.socket
            </pre>
          </div>

          <div className="p-3 bg-[#060e1d] border border-slate-800/80 rounded-md">
            <span className="font-semibold text-slate-200">2. Launch Citadel native runtime:</span>
            <pre className="text-[11px] font-mono text-cyan-300 bg-[#030712] p-2 rounded mt-1 border border-slate-900">
              pnpm run tauri dev -- --enable-container-socket
            </pre>
          </div>
        </div>
      </div>

      {/* Planned Feature Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 bg-[#040915] border border-slate-800 rounded-lg">
          <div className="text-slate-300 font-medium">Compose Stacks</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Isolated microservice clusters and target attack surfaces inside disposable network namespaces.
          </div>
        </div>

        <div className="p-3.5 bg-[#040915] border border-slate-800 rounded-lg">
          <div className="text-slate-300 font-medium">Resource Cgroups</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Hard memory limits and CPU pinning to prevent target tools from freezing host system resources.
          </div>
        </div>
      </div>
    </div>
  );
};
