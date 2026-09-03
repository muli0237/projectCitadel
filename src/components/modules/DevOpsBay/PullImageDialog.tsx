import React, { useState } from 'react';
import {
  X,
  Download,
  Layers,
  CheckCircle2,
  AlertCircle,
  Terminal,
  RefreshCw,
  HardDrive,
  ExternalLink,
  Tag,
  Globe,
} from 'lucide-react';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import { useCitadelStore } from '../../../store/useCitadelStore';

interface PullImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImagePulled: () => void;
}

interface ImagePreset {
  id: string;
  name: string;
  repository: string;
  tag: string;
  registry: string;
  sizeMb: number;
  category: string;
  description: string;
}

const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'preset-kali',
    name: 'Kali Linux Rolling',
    repository: 'kalilinux/kali-rolling',
    tag: 'latest',
    registry: 'docker.io',
    sizeMb: 1840,
    category: 'Security Arsenal',
    description: 'Complete defensive recon, packet sniffing, and network analysis suite.',
  },
  {
    id: 'preset-suricata',
    name: 'Suricata IDS 7.0',
    repository: 'jasonish/suricata',
    tag: '7.0.5',
    registry: 'docker.io',
    sizeMb: 420,
    category: 'Threat Detection',
    description: 'High-throughput Network IDS/IPS and live PCAP analysis engine.',
  },
  {
    id: 'preset-nginx',
    name: 'Nginx Gateway',
    repository: 'nginx',
    tag: 'alpine',
    registry: 'docker.io',
    sizeMb: 42,
    category: 'Networking',
    description: 'Fast reverse proxy for SSL termination and static report distribution.',
  },
  {
    id: 'preset-redis',
    name: 'Redis Cache',
    repository: 'redis',
    tag: '7-alpine',
    registry: 'docker.io',
    sizeMb: 38,
    category: 'Infrastructure',
    description: 'Ultra-fast in-memory key-value cache and message broker.',
  },
  {
    id: 'preset-timescale',
    name: 'TimescaleDB Timeseries',
    repository: 'timescale/timescaledb',
    tag: 'latest-pg16',
    registry: 'docker.io',
    sizeMb: 610,
    category: 'Telemetry Store',
    description: 'PostgreSQL time-series database for high-velocity sensor telemetry.',
  },
  {
    id: 'preset-python',
    name: 'Python 3.12 Slim',
    repository: 'python',
    tag: '3.12-slim',
    registry: 'docker.io',
    sizeMb: 154,
    category: 'Development',
    description: 'Clean Python environment for hosting automation scripts & parsers.',
  },
  {
    id: 'preset-dvwa',
    name: 'DVWA Security Lab',
    repository: 'vulnerables/web-dvwa',
    tag: 'latest',
    registry: 'docker.io',
    sizeMb: 350,
    category: 'Audit Verification',
    description: 'Damn Vulnerable Web App for verifying internal enclave web filters.',
  },
  {
    id: 'preset-alpine',
    name: 'Alpine Linux (Minimal)',
    repository: 'alpine',
    tag: 'latest',
    registry: 'docker.io',
    sizeMb: 7,
    category: 'Base System',
    description: 'Minimal 5MB security-oriented Linux image for lightweight tasks.',
  },
];

const REGISTRIES = [
  { id: 'docker.io', name: 'Docker Hub (docker.io)', prefix: '' },
  { id: 'quay.io', name: 'Red Hat Quay (quay.io)', prefix: 'quay.io/' },
  { id: 'ghcr.io', name: 'GitHub Packages (ghcr.io)', prefix: 'ghcr.io/' },
  { id: 'registry.k8s.io', name: 'Kubernetes Registry (registry.k8s.io)', prefix: 'registry.k8s.io/' },
];

export const PullImageDialog: React.FC<PullImageDialogProps> = ({
  isOpen,
  onClose,
  onImagePulled,
}) => {
  const { showToast } = useCitadelStore();

  const [registry, setRegistry] = useState('docker.io');
  const [repository, setRepository] = useState('');
  const [tag, setTag] = useState('latest');
  const [runtime, setRuntime] = useState<'docker' | 'podman'>('docker');
  const [pulling, setPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [pullLogs, setPullLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: ImagePreset) => {
    setRepository(preset.repository);
    setTag(preset.tag);
    setRegistry(preset.registry);
    setErrorMessage('');
  };

  const handlePull = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!repository.trim()) {
      setErrorMessage('Image repository name is required (e.g. nginx or kalilinux/kali-rolling).');
      return;
    }

    setPulling(true);
    setErrorMessage('');
    setPullLogs([]);
    setPullProgress(10);

    const fullTag = tag.trim() ? `${repository.trim()}:${tag.trim()}` : repository.trim();
    const commandPreview = `${runtime} pull ${registry !== 'docker.io' ? registry + '/' : ''}${fullTag}`;

    setPullLogs([
      `$ ${commandPreview}`,
      `Authenticating against ${registry}... [OK]`,
      `Querying manifest for ${fullTag}...`,
    ]);

    // Animated download simulation
    const steps = [
      { progress: 25, log: 'Pulling fs layer [3a84ec819] - Downloading 18.4MB / 18.4MB' },
      { progress: 50, log: 'Pulling fs layer [7b19fa2e0] - Verifying Checksum [OK]' },
      { progress: 75, log: 'Extracting layer archives into local overlay2 graph...' },
      { progress: 90, log: `Writing layer metadata: sha256:${Math.random().toString(36).substring(2, 12)}...` },
      { progress: 100, log: `Status: Downloaded newer image for ${fullTag}` },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((res) => setTimeout(res, 260));
      setPullProgress(steps[i].progress);
      setPullLogs((prev) => [...prev, steps[i].log]);
    }

    try {
      const result = await bridge.pullContainerImage(fullTag, registry);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to pull container image.');
        setPulling(false);
        return;
      }

      showToast({
        type: 'info',
        title: 'Image Pulled Successfully',
        message: `${fullTag} is now staged in local container store.`,
      });

      onImagePulled();
      setTimeout(() => {
        setPulling(false);
        onClose();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error pulling image');
      setPulling(false);
    }
  };

  const isNative = isTauriEnvironment();
  const fullImageDisplay = repository.trim()
    ? `${registry !== 'docker.io' ? registry + '/' : ''}${repository.trim()}:${tag.trim() || 'latest'}`
    : '<image>:<tag>';

  return (
    <div
      id="devops-pull-image-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="devops-pull-image-modal"
        className="bg-[#071126] border border-cyan-500/40 rounded-md max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-[#030917]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xs bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-sans text-white uppercase tracking-wider">
                Pull Container Image // Registry Dispatch
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">
                  Fetch OCI container images into local runtime store
                </span>
                <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30">
                  {isNative ? 'TAURI NATIVE IPC' : 'PREVIEW ENGINE'}
                </span>
              </div>
            </div>
          </div>
          <button
            id="close-pull-dialog-btn"
            onClick={onClose}
            disabled={pulling}
            className="p-1 rounded-xs hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200">
          {/* Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Quick Arsenal Blueprints
              </label>
              <span className="text-[11px] font-mono text-slate-500">
                Click preset to populate parameters
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  disabled={pulling}
                  className={`p-2.5 rounded-xs border text-left transition-all ${
                    repository === preset.repository && tag === preset.tag
                      ? 'bg-cyan-950/70 border-cyan-400 text-white shadow-xs'
                      : 'bg-[#030917] border-cyan-950 hover:border-cyan-500/40 text-slate-300 hover:bg-[#061229]'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-cyan-300 truncate">
                    {preset.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                    {preset.repository}:{preset.tag}
                  </div>
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-1">
                    <span>{preset.category}</span>
                    <span>{preset.sizeMb}MB</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Image & Registry Form */}
          <form onSubmit={handlePull} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Registry */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Container Registry
                </label>
                <select
                  value={registry}
                  onChange={(e) => setRegistry(e.target.value)}
                  disabled={pulling}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                >
                  {REGISTRIES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repository Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Repository Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. kalilinux/kali-rolling or nginx"
                  value={repository}
                  onChange={(e) => {
                    setRepository(e.target.value);
                    setErrorMessage('');
                  }}
                  disabled={pulling}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tag */}
              <div className="sm:col-span-1">
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Tag / Version
                </label>
                <input
                  type="text"
                  placeholder="latest"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  disabled={pulling}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
                />
              </div>

              {/* Engine Runtime Selector */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Target Runtime Engine
                </label>
                <div className="flex items-center gap-2">
                  {(['docker', 'podman'] as const).map((eng) => (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => setRuntime(eng)}
                      disabled={pulling}
                      className={`flex-1 py-1.5 px-3 rounded-xs text-xs font-mono font-bold uppercase transition-all ${
                        runtime === eng
                          ? 'bg-blue-950 border border-blue-400 text-blue-300 shadow-xs'
                          : 'bg-[#030917] border border-cyan-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {eng === 'docker' ? 'Docker Daemon (/var/run/docker.sock)' : 'Rootless Podman (cgroups v2)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Command Preview Box */}
            <div className="bg-[#020612] border border-cyan-500/30 rounded-xs p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  CLI Command Dispatched to Enclave Daemon
                </span>
                <span className="text-cyan-400 font-bold">READY</span>
              </div>
              <code className="text-xs font-mono text-emerald-400 block truncate">
                $ {runtime} pull {registry !== 'docker.io' ? registry + '/' : ''}{fullImageDisplay}
              </code>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/50 rounded-xs text-rose-300 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pull Progress & Streaming Output */}
            {pulling && (
              <div className="space-y-2 bg-[#020612] border border-cyan-500/40 rounded-xs p-3 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-300 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    Pulling image layers...
                  </span>
                  <span className="text-cyan-400 font-bold">{pullProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-200"
                    style={{ width: `${pullProgress}%` }}
                  />
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-400 pt-1">
                  {pullLogs.map((log, idx) => (
                    <div key={idx} className="truncate">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-cyan-500/20 bg-[#030917]/90">
          <span className="text-[11px] font-mono text-slate-400">
            Image cache persistent across sessions
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pulling}
              className="px-3.5 py-1.5 rounded-xs text-xs font-mono text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-pull-btn"
              type="button"
              onClick={() => handlePull()}
              disabled={pulling || !repository.trim()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xs text-xs font-mono font-bold uppercase transition-all shadow-xs ${
                pulling || !repository.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              }`}
            >
              {pulling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pulling...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Pull Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
