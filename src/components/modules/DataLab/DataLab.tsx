import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Terminal,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Database,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  Cpu,
  Zap,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge } from '../../../services/tauriBridge';
import { DataPreviewResult, PythonEnvironment } from '../../../types';
import { StatusPill } from '../../common/StatusPill';

import datascienceCardSvg from '../../../assets/images/card_datascience_vector.svg';

export const DataLab: React.FC = () => {
  const {
    activeProject,
    createTerminalTab,
    setActiveModule,
    showConfirmation,
    showToast,
  } = useCitadelStore();

  const [envs, setEnvs] = useState<PythonEnvironment[]>([]);
  const [dataPreview, setDataPreview] = useState<DataPreviewResult | null>(null);
  const [selectedEnvId, setSelectedEnvId] = useState<string>('');

  const loadData = async () => {
    const pyEnvs = await bridge.discoverPythonEnvironments();
    setEnvs(pyEnvs);
    if (pyEnvs.length > 0 && !selectedEnvId) {
      setSelectedEnvId(pyEnvs[0].id);
    }
    const preview = await bridge.previewDataFile('suricata_sample.csv', 50);
    setDataPreview(preview);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInitVenv = () => {
    showConfirmation({
      title: 'Initialize Fast Python venv with Astral UV?',
      message: `Citadel will run "uv venv .venv --python 3.12" inside ${activeProject?.path || 'workspace'}. No network packages will be downloaded until explicitly authorized.`,
      confirmLabel: 'Create Virtualenv',
      onConfirm: async () => {
        showToast({
          type: 'success',
          title: 'Virtual Environment Created',
          message: '.venv created at project root.',
        });
        await loadData();
      },
    });
  };

  const selectedEnv = envs.find((e) => e.id === selectedEnvId);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent text-slate-200 relative">
      <div className="relative z-10 space-y-6">
        {/* 1. CyberGuard Data Science Header */}
      <div className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-[#071126]/90 p-5 shadow-xl backdrop-blur-md">
        <div
          className="absolute top-0 right-0 w-48 h-full opacity-15 pointer-events-none bg-contain bg-no-repeat bg-right"
          style={{ backgroundImage: `url(${datascienceCardSvg})` }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-sans font-bold text-white uppercase tracking-[0.15em]">
                  Data Lab & Telemetry Pipelines
                </h1>
                <StatusPill status="healthy" label="UV COMPILED" />
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                Isolated scientific execution kernels • High-speed CSV/Parquet inspector • Zero cloud leakage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInitVenv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Init UV Virtualenv</span>
            </button>
            <button
              onClick={() => {
                createTerminalTab('Python Environment');
                setActiveModule('terminal-deck');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xs bg-[#030917] hover:bg-[#0a1630] border border-cyan-950 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python REPL</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Discovered Virtual Environments */}
      <div className="bg-[#071126] border border-cyan-500/20 rounded-md p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              Discovered Virtual Environments & Kernels ({envs.length})
            </h3>
          </div>
          <button
            onClick={loadData}
            className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Rescan Path</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {envs.map((env) => {
            const isSelected = env.id === selectedEnvId;
            return (
              <div
                key={env.id}
                onClick={() => setSelectedEnvId(env.id)}
                className={`p-4 rounded-xs border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#09152e] border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-[#030917] border-cyan-950 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold font-mono text-white truncate">
                    {env.name}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-xs bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                    {env.version}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-slate-400 truncate mb-3">
                  {env.path}
                </div>

                <div className="pt-2 border-t border-cyan-950 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                  <span>Packages: {env.installedPackagesCount}</span>
                  <span className="text-slate-400">{env.type.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CSV / Parquet Telemetry Inspector */}
      {dataPreview && (
        <div className="bg-[#071126] border border-cyan-500/20 rounded-md p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-cyan-950">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                Raw Telemetry Dataset: <span className="text-cyan-300">{dataPreview.fileName}</span>
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {dataPreview.rowCount} records • Size: {(dataPreview.fileSizeBytes / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="overflow-x-auto border border-cyan-950 rounded-xs">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#030917] border-b border-cyan-950 text-cyan-400">
                  {dataPreview.columns.map((col) => (
                    <th key={col} className="p-2.5 font-bold uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataPreview.rows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-cyan-950/60 hover:bg-[#0a1630] transition-colors"
                  >
                    {dataPreview.columns.map((col) => (
                      <td key={col} className="p-2.5 text-slate-300 truncate max-w-[180px]">
                        {String(row[col] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
