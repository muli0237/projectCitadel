import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Container,
  Plus,
  Trash2,
  Terminal,
  Settings,
  Shield,
  Layers,
  AlertCircle,
  Cpu,
  Zap,
} from 'lucide-react';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import { ContainerImageInfo, ContainerSummary, RunContainerConfig } from '../../../types';
import { useCitadelStore } from '../../../store/useCitadelStore';

interface RunContainerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContainerLaunched: () => void;
  existingContainers: ContainerSummary[];
  preselectedImage?: string;
}

interface PortEntry {
  id: string;
  hostPort: string;
  containerPort: string;
  protocol: 'tcp' | 'udp';
}

interface EnvEntry {
  id: string;
  key: string;
  value: string;
}

const COMMON_PORT_PRESETS = [
  { label: 'HTTP 8080:80', hostPort: '8080', containerPort: '80', protocol: 'tcp' as const },
  { label: 'HTTPS 8443:443', hostPort: '8443', containerPort: '443', protocol: 'tcp' as const },
  { label: 'SSH 2222:22', hostPort: '2222', containerPort: '22', protocol: 'tcp' as const },
  { label: 'Postgres 5432:5432', hostPort: '5432', containerPort: '5432', protocol: 'tcp' as const },
  { label: 'Redis 6379:6379', hostPort: '6379', containerPort: '6379', protocol: 'tcp' as const },
];

export const RunContainerDialog: React.FC<RunContainerDialogProps> = ({
  isOpen,
  onClose,
  onContainerLaunched,
  existingContainers,
  preselectedImage,
}) => {
  const { showToast } = useCitadelStore();

  const [availableImages, setAvailableImages] = useState<ContainerImageInfo[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [customImageInput, setCustomImageInput] = useState<string>('');
  const [containerName, setContainerName] = useState<string>('');
  const [runtime, setRuntime] = useState<'docker' | 'podman'>('docker');
  const [ports, setPorts] = useState<PortEntry[]>([]);
  const [envVars, setEnvVars] = useState<EnvEntry[]>([]);
  const [command, setCommand] = useState<string>('');
  const [memoryLimitMb, setMemoryLimitMb] = useState<number>(512);
  const [restartPolicy, setRestartPolicy] = useState<'no' | 'always' | 'on-failure' | 'unless-stopped'>('unless-stopped');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [launching, setLaunching] = useState<boolean>(false);

  const generateSuggestedName = (imgStr: string) => {
    const raw = imgStr.split(':')[0].split('/').pop() || 'workload';
    const randSuffix = Math.floor(Math.random() * 90 + 10);
    setContainerName(`${raw}-node-${randSuffix}`);
  };

  useEffect(() => {
    if (isOpen) {
      bridge.listContainerImages().then((imgs) => {
        setAvailableImages(imgs);
        const defaultImg = preselectedImage || (imgs.length > 0 ? `${imgs[0].repository}:${imgs[0].tag}` : 'kalilinux/kali-rolling:latest');
        setSelectedImage(defaultImg);
        generateSuggestedName(defaultImg);
      });
      setPorts([{ id: 'p-1', hostPort: '8080', containerPort: '80', protocol: 'tcp' }]);
      setEnvVars([]);
      setCommand('');
      setErrorMessage('');
    }
  }, [isOpen, preselectedImage]);

  const handleImageChange = (val: string) => {
    setSelectedImage(val);
    if (val !== 'custom') {
      generateSuggestedName(val);
    }
    setErrorMessage('');
  };

  const addPort = () => {
    const newId = `p-${Date.now()}`;
    setPorts([...ports, { id: newId, hostPort: '8081', containerPort: '80', protocol: 'tcp' }]);
  };

  const removePort = (id: string) => {
    setPorts(ports.filter((p) => p.id !== id));
  };

  const updatePort = (id: string, field: keyof PortEntry, val: string) => {
    setPorts(
      ports.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const applyPortPreset = (preset: typeof COMMON_PORT_PRESETS[0]) => {
    const exists = ports.some((p) => p.hostPort === preset.hostPort);
    if (!exists) {
      setPorts([
        ...ports,
        {
          id: `p-${Date.now()}`,
          hostPort: preset.hostPort,
          containerPort: preset.containerPort,
          protocol: preset.protocol,
        },
      ]);
    }
  };

  const addEnvVar = () => {
    const newId = `e-${Date.now()}`;
    setEnvVars([...envVars, { id: newId, key: '', value: '' }]);
  };

  const removeEnvVar = (id: string) => {
    setEnvVars(envVars.filter((e) => e.id !== id));
  };

  const updateEnvVar = (id: string, field: 'key' | 'value', val: string) => {
    setEnvVars(
      envVars.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  const effectiveImage = selectedImage === 'custom' ? customImageInput.trim() : selectedImage;

  // Real-time syntax preview string
  const commandPreview = React.useMemo(() => {
    const parts = [runtime, 'run', '-d'];
    if (containerName.trim()) {
      parts.push(`--name ${containerName.trim()}`);
    }
    if (restartPolicy !== 'no') {
      parts.push(`--restart ${restartPolicy}`);
    }
    if (memoryLimitMb) {
      parts.push(`--memory ${memoryLimitMb}m`);
    }
    ports.forEach((p) => {
      if (p.hostPort && p.containerPort) {
        parts.push(`-p ${p.hostPort}:${p.containerPort}/${p.protocol}`);
      }
    });
    envVars.forEach((e) => {
      if (e.key.trim()) {
        parts.push(`-e ${e.key.trim()}="${e.value.trim()}"`);
      }
    });
    parts.push(effectiveImage || '<image>');
    if (command.trim()) {
      parts.push(command.trim());
    }
    return parts.join(' ');
  }, [runtime, containerName, restartPolicy, memoryLimitMb, ports, envVars, effectiveImage, command]);

  const handleLaunch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!containerName.trim()) {
      setErrorMessage('Container name is required.');
      return;
    }

    if (!effectiveImage) {
      setErrorMessage('A base container image must be selected.');
      return;
    }

    // Name collision check
    const collision = existingContainers.some(
      (c) => c.name.toLowerCase() === containerName.trim().toLowerCase()
    );
    if (collision) {
      setErrorMessage(`A container with name "${containerName.trim()}" already exists.`);
      return;
    }

    // Validate ports
    for (const p of ports) {
      const h = Number(p.hostPort);
      const c = Number(p.containerPort);
      if (isNaN(h) || h < 1 || h > 65535) {
        setErrorMessage(`Invalid host port: "${p.hostPort}". Must be 1-65535.`);
        return;
      }
      if (isNaN(c) || c < 1 || c > 65535) {
        setErrorMessage(`Invalid container port: "${p.containerPort}". Must be 1-65535.`);
        return;
      }
    }

    setLaunching(true);
    setErrorMessage('');

    try {
      const config: RunContainerConfig = {
        name: containerName.trim(),
        image: effectiveImage,
        runtime,
        ports: ports.map((p) => ({
          hostPort: Number(p.hostPort),
          containerPort: Number(p.containerPort),
          protocol: p.protocol,
        })),
        envVars: envVars.filter((e) => e.key.trim().length > 0),
        command: command.trim() || undefined,
        memoryLimitMb,
        restartPolicy,
      };

      const result = await bridge.runContainer(config);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to start container.');
        setLaunching(false);
        return;
      }

      showToast({
        type: 'info',
        title: 'Container Started',
        message: `${containerName.trim()} is running and bound to enclave socket.`,
      });

      onContainerLaunched();
      setLaunching(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to launch container');
      setLaunching(false);
    }
  };

  const isNative = isTauriEnvironment();

  if (!isOpen) return null;

  return (
    <div
      id="devops-run-container-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="devops-run-container-modal"
        className="bg-[#071126] border border-cyan-500/40 rounded-md max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-[#030917]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
              <Play className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-sans text-white uppercase tracking-wider">
                Deploy & Run Container // Launchpad
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">
                  Provision container sandbox with custom ports, cgroups & env
                </span>
                <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30">
                  {isNative ? 'TAURI NATIVE IPC' : 'PREVIEW ENGINE'}
                </span>
              </div>
            </div>
          </div>
          <button
            id="close-run-dialog-btn"
            onClick={onClose}
            disabled={launching}
            className="p-1 rounded-xs hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200">
          <form onSubmit={handleLaunch} className="space-y-4">
            {/* 1. Base Image & Container Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Base Image <span className="text-cyan-400">*</span>
                </label>
                <select
                  value={selectedImage}
                  onChange={(e) => handleImageChange(e.target.value)}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                >
                  {availableImages.map((img) => (
                    <option key={img.id} value={`${img.repository}:${img.tag}`}>
                      {img.repository}:{img.tag} ({img.sizeMb}MB)
                    </option>
                  ))}
                  <option value="custom">+ Specify Custom Image Tag...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Container Instance Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. web-gateway-01"
                  value={containerName}
                  onChange={(e) => {
                    setContainerName(e.target.value);
                    setErrorMessage('');
                  }}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Custom Image input if selected */}
            {selectedImage === 'custom' && (
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Custom Repository & Tag <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ghcr.io/org/tool:v1.0"
                  value={customImageInput}
                  onChange={(e) => setCustomImageInput(e.target.value)}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
            )}

            {/* 2. Runtime Engine & Memory Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Runtime Daemon
                </label>
                <select
                  value={runtime}
                  onChange={(e) => setRuntime(e.target.value as any)}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                >
                  <option value="docker">Docker Engine</option>
                  <option value="podman">Rootless Podman</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Memory Ceiling
                </label>
                <select
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                >
                  <option value={256}>256 MB (Lightweight)</option>
                  <option value={512}>512 MB (Standard)</option>
                  <option value={1024}>1024 MB (1.0 GB)</option>
                  <option value={2048}>2048 MB (2.0 GB)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">
                  Restart Policy
                </label>
                <select
                  value={restartPolicy}
                  onChange={(e) => setRestartPolicy(e.target.value as any)}
                  className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                >
                  <option value="unless-stopped">unless-stopped</option>
                  <option value="always">always</option>
                  <option value="on-failure">on-failure</option>
                  <option value="no">no (ephemeral)</option>
                </select>
              </div>
            </div>

            {/* 3. Port Mappings */}
            <div className="space-y-2 pt-1 border-t border-cyan-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Container className="w-3.5 h-3.5 text-cyan-400" />
                  Network Port Forwarding (-p host:container)
                </label>
                <button
                  type="button"
                  onClick={addPort}
                  className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Port</span>
                </button>
              </div>

              {/* Quick port presets */}
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] font-mono text-slate-500 self-center">Presets:</span>
                {COMMON_PORT_PRESETS.map((pst, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyPortPreset(pst)}
                    className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#030917] border border-cyan-950 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
                  >
                    +{pst.label}
                  </button>
                ))}
              </div>

              {ports.length === 0 ? (
                <div className="text-[11px] font-mono text-slate-500 p-2.5 bg-[#020612] rounded-xs border border-dashed border-cyan-950 text-center">
                  No port mappings defined. Container will run in host isolation.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {ports.map((port) => (
                    <div
                      key={port.id}
                      className="flex items-center gap-2 p-1.5 bg-[#030917] border border-cyan-950 rounded-xs"
                    >
                      <span className="text-[10px] font-mono text-slate-400 w-12 text-right">Host:</span>
                      <input
                        type="number"
                        min="1"
                        max="65535"
                        placeholder="8080"
                        value={port.hostPort}
                        onChange={(e) => updatePort(port.id, 'hostPort', e.target.value)}
                        className="w-24 bg-[#071126] border border-cyan-500/30 rounded-xs px-2 py-1 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                      />
                      <span className="text-slate-500 font-mono text-xs">➔</span>
                      <span className="text-[10px] font-mono text-slate-400">Container:</span>
                      <input
                        type="number"
                        min="1"
                        max="65535"
                        placeholder="80"
                        value={port.containerPort}
                        onChange={(e) => updatePort(port.id, 'containerPort', e.target.value)}
                        className="w-24 bg-[#071126] border border-cyan-500/30 rounded-xs px-2 py-1 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                      />
                      <select
                        value={port.protocol}
                        onChange={(e) => updatePort(port.id, 'protocol', e.target.value as any)}
                        className="bg-[#071126] border border-cyan-500/30 rounded-xs px-2 py-1 text-xs font-mono text-slate-300"
                      >
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removePort(port.id)}
                        className="p-1 rounded-xs text-slate-500 hover:text-rose-400 ml-auto"
                        title="Remove Port"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Environment Variables */}
            <div className="space-y-2 pt-1 border-t border-cyan-500/20">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  Environment Variables (-e KEY=VAL)
                </label>
                <button
                  type="button"
                  onClick={addEnvVar}
                  className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Env</span>
                </button>
              </div>

              {envVars.length === 0 ? (
                <div className="text-[11px] font-mono text-slate-500 p-2.5 bg-[#020612] rounded-xs border border-dashed border-cyan-950 text-center">
                  Optional: Pass environment parameters like secrets or ports.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {envVars.map((env) => (
                    <div
                      key={env.id}
                      className="flex items-center gap-2 p-1.5 bg-[#030917] border border-cyan-950 rounded-xs"
                    >
                      <input
                        type="text"
                        placeholder="KEY (e.g. PORT)"
                        value={env.key}
                        onChange={(e) => updateEnvVar(env.id, 'key', e.target.value)}
                        className="w-1/2 bg-[#071126] border border-cyan-500/30 rounded-xs px-2 py-1 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                      />
                      <span className="text-slate-500 font-mono text-xs">=</span>
                      <input
                        type="text"
                        placeholder="VALUE (e.g. 8080)"
                        value={env.value}
                        onChange={(e) => updateEnvVar(env.id, 'value', e.target.value)}
                        className="w-1/2 bg-[#071126] border border-cyan-500/30 rounded-xs px-2 py-1 text-xs font-mono text-slate-200 focus:outline-hidden focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => removeEnvVar(env.id)}
                        className="p-1 rounded-xs text-slate-500 hover:text-rose-400"
                        title="Remove Variable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Custom Command / Entrypoint */}
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">
                Custom Entrypoint Command <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder='Leave blank for image default, or e.g. /bin/bash -c "sleep infinity"'
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="w-full bg-[#030917] border border-cyan-500/30 rounded-xs px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            {/* Command Preview Box */}
            <div className="bg-[#020612] border border-cyan-500/30 rounded-xs p-3">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Generated Enclave Execution Command
                </span>
                <span className="text-emerald-400 font-bold">DISPATCH READY</span>
              </div>
              <code className="text-xs font-mono text-emerald-400 block truncate">
                $ {commandPreview}
              </code>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-500/50 rounded-xs text-rose-300 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-cyan-500/20 bg-[#030917]/90">
          <span className="text-[11px] font-mono text-slate-400">
            Container process will launch isolated in background
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={launching}
              className="px-3.5 py-1.5 rounded-xs text-xs font-mono text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-launch-btn"
              type="button"
              onClick={() => handleLaunch()}
              disabled={launching || !containerName.trim()}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xs text-xs font-mono font-bold uppercase transition-all shadow-xs ${
                launching || !containerName.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{launching ? 'Launching...' : 'Run Container'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
