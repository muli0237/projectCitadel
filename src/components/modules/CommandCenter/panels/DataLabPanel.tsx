import React from 'react';
import {
  Database,
  AlertTriangle,
  FileCode,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';

export const DataLabPanel: React.FC = () => {
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
                Jupyter Data Science Kernel Offline
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                UNAVAILABLE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              Python analytical environment requires a local virtual environment with Jupyter execution kernel and dataframe libraries (polars/pandas).
            </p>
          </div>
        </div>
      </div>

      {/* Activation Guide */}
      <div className="bg-[#040915] border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Steps to Activate Data Science Lab</span>
        </div>

        <div className="space-y-2 text-xs text-slate-400">
          <div className="p-3 bg-[#060e1d] border border-slate-800/80 rounded-md">
            <span className="font-semibold text-slate-200">1. Initialize workspace virtualenv:</span>
            <pre className="text-[11px] font-mono text-cyan-300 bg-[#030712] p-2 rounded mt-1 border border-slate-900">
              python3 -m venv /media/kali/CITADEL_DRIVE/Citadel/workspace/.venv
            </pre>
          </div>

          <div className="p-3 bg-[#060e1d] border border-slate-800/80 rounded-md">
            <span className="font-semibold text-slate-200">2. Install Jupyter & Polars kernel:</span>
            <pre className="text-[11px] font-mono text-cyan-300 bg-[#030712] p-2 rounded mt-1 border border-slate-900">
              source .venv/bin/activate && pip install ipykernel polars duckdb
            </pre>
          </div>
        </div>
      </div>

      {/* Planned Feature Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 bg-[#040915] border border-slate-800 rounded-lg">
          <div className="text-slate-300 font-medium">Dataset Cache & Viewer</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Local parquet and CSV file inspector with schema inference and fast search filters.
          </div>
        </div>

        <div className="p-3.5 bg-[#040915] border border-slate-800 rounded-lg">
          <div className="text-slate-300 font-medium">SQLite Embedded Query Engine</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Query workspace evidence artifacts and OSINT dumps directly on encrypted storage.
          </div>
        </div>
      </div>
    </div>
  );
};
