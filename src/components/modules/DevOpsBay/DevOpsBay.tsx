import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Play,
  Square,
  RotateCcw,
  Trash2,
  Terminal,
  FileText,
  Layers,
  Cpu,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Server,
  Radio,
  Zap,
  Download,
  Plus,
  Copy,
  Check,
  HardDrive,
  Network,
  Clock,
  Settings,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import { ContainerSummary, ContainerImageInfo } from '../../../types';
import { StatusPill } from '../../common/StatusPill';
import { PullImageDialog } from './PullImageDialog';
import { RunContainerDialog } from './RunContainerDialog';
import { StopContainerModal } from './StopContainerModal';
import { DeleteContainerModal } from './DeleteContainerModal';

import devopsCardSvg from '../../../assets/images/card_devops_vector.svg';

type DevOpsTab = 'CONTAINERS' | 'IMAGES';
type StatusFilter = 'ALL' | 'RUNNING' | 'EXITED';

export const DevOpsBay: React.FC = () => {
  const {
    createTerminalTab,
    setActiveModule,
    showToast,
    showConfirmation,
  } = useCitadelStore();

  const [activeTab, setActiveTab] = useState<DevOpsTab>('CONTAINERS');
  const [containers, setContainers] = useState<ContainerSummary[]>([]);
  const [images, setImages] = useState<ContainerImageInfo[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');
  const [logsText, setLogsText] = useState<string>('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
  const [logFilterQuery, setLogFilterQuery] = useState('');
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('ALL');

  // Dialog & Modal states
  const [isPullDialogOpen, setIsPullDialogOpen] = useState(false);
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [runPreselectedImage, setRunPreselectedImage] = useState<string>('');
  const [containerToStop, setContainerToStop] = useState<ContainerSummary | null>(null);
  const [containerToDelete, setContainerToDelete] = useState<ContainerSummary | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Data Loading
  const loadData = async () => {
    const [containerList, imageList] = await Promise.all([
      bridge.listContainers(),
      bridge.listContainerImages(),
    ]);

    setContainers(containerList);
    setImages(imageList);

    if (containerList.length > 0) {
      if (!selectedContainerId || !containerList.some((c) => c.id === selectedContainerId)) {
        setSelectedContainerId(containerList[0].id);
        loadLogs(containerList[0].id);
      }
    } else {
      setSelectedContainerId('');
      setLogsText('');
    }
  };

  const loadLogs = async (id: string) => {
    if (!id) return;
    setLoadingLogs(true);
    const logs = await bridge.getContainerLogs(id);
    setLogsText(logs);
    setLoadingLogs(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setIsPullDialogOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        setRunPreselectedImage('');
        setIsRunDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-refresh log timer
  useEffect(() => {
    if (!autoRefreshLogs || !selectedContainerId) return;

    const interval = setInterval(() => {
      loadLogs(selectedContainerId);
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefreshLogs, selectedContainerId]);

  // Actions
  const handleQuickRestart = async (container: ContainerSummary) => {
    await bridge.containerAction(container.id, 'restart');
    await loadData();
    showToast({
      type: 'info',
      title: 'Container Restarted',
      message: `${container.name} processes cycled cleanly.`,
    });
  };

  const handleQuickStart = async (container: ContainerSummary) => {
    await bridge.containerAction(container.id, 'start');
    await loadData();
    showToast({
      type: 'info',
      title: 'Container Started',
      message: `${container.name} is operational.`,
    });
  };

  const handleLaunchTerminalPTY = (container: ContainerSummary) => {
    const cmd = `docker exec -it ${container.name} /bin/bash || docker exec -it ${container.name} /bin/sh`;
    createTerminalTab(`PTY: ${container.name}`);
    setActiveModule('terminal-deck');
    showToast({
      type: 'info',
      title: 'Container PTY Connected',
      message: `Attached terminal deck to ${container.name} (${container.id}).`,
    });
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(logsText);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleRemoveImage = (img: ContainerImageInfo) => {
    showConfirmation({
      title: `Delete Image ${img.repository}:${img.tag}?`,
      message: `This will remove ${img.repository}:${img.tag} (${img.sizeMb}MB) from local container store.`,
      confirmLabel: 'Remove Image',
      isDestructive: true,
      onConfirm: async () => {
        await bridge.removeContainerImage(img.id);
        await loadData();
        showToast({
          type: 'warning',
          title: 'Image Removed',
          message: `${img.repository}:${img.tag} purged from cache.`,
        });
      },
    });
  };

  const handleResetArsenal = () => {
    showConfirmation({
      title: 'Reset Container Bay Defaults?',
      message: 'This will reset all containers and images to default factory instances. Any user-created containers will be removed.',
      confirmLabel: 'Reset Containers & Images',
      isDestructive: true,
      onConfirm: async () => {
        await bridge.resetContainersToDefault();
        await loadData();
        showToast({
          type: 'info',
          title: 'DevOps Bay Reset',
          message: 'Default container workloads and OCI images restored.',
        });
      },
    });
  };

  const handleLaunchFromImage = (img: ContainerImageInfo) => {
    setRunPreselectedImage(`${img.repository}:${img.tag}`);
    setIsRunDialogOpen(true);
  };

  // Filtered lists
  const filteredContainers = containers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.image.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.command && c.command.toLowerCase().includes(q));

    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'RUNNING' && c.status === 'running') ||
      (filterStatus === 'EXITED' && c.status !== 'running');

    return matchesSearch && matchesStatus;
  });

  const filteredImages = images.filter((img) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      img.repository.toLowerCase().includes(q) ||
      img.tag.toLowerCase().includes(q) ||
      (img.description && img.description.toLowerCase().includes(q))
    );
  });

  const selectedContainer = containers.find((c) => c.id === selectedContainerId);
  const runningCount = containers.filter((c) => c.status === 'running').length;
  const isNative = isTauriEnvironment();

  // Filtered log lines
  const displayLogs = logFilterQuery.trim()
    ? logsText
        .split('\n')
        .filter((line) => line.toLowerCase().includes(logFilterQuery.toLowerCase()))
        .join('\n')
    : logsText;

  return (
    <div
      id="devops-bay-root"
      className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent text-slate-200 relative font-sans"
    >
      <div className="relative z-10 space-y-6">
        {/* 1. DevOps Tactical Header */}
        <div className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-[#071126]/90 p-5 shadow-xl backdrop-blur-md">
          <div
            className="absolute top-0 right-0 w-48 h-full opacity-15 pointer-events-none bg-contain bg-no-repeat bg-right"
            style={{ backgroundImage: `url(${devopsCardSvg})` }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xs bg-blue-950/80 border border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)]">
                <Container className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-sans font-bold text-white uppercase tracking-[0.15em]">
                    DevOps Container Bay // Orchestration & Sandbox
                  </h1>
                  <StatusPill status="healthy" label="DAEMON ACTIVE" pulse />
                  <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 shadow-xs">
                    {isNative ? 'TAURI DESKTOP (UNIX SOCKET)' : 'PREVIEW & SANDBOX DAEMON'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Rootless container engine • Socket:{' '}
                  <span className="text-cyan-300 font-mono">/var/run/docker.sock</span> • Active:{' '}
                  <span className="text-emerald-400 font-bold">
                    {runningCount}/{containers.length} Running
                  </span>{' '}
                  • Staged Images: <span className="text-cyan-300 font-bold">{images.length} OCI</span>
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pull Image Button */}
              <button
                id="devops-pull-image-btn"
                onClick={() => setIsPullDialogOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xs bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-xs"
                title="Pull Container Image from Registry (Alt+P)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pull Image</span>
                <kbd className="hidden md:inline px-1 py-0.2 bg-black/40 rounded-xs text-[9px] text-cyan-400 border border-cyan-500/20">
                  Alt+P
                </kbd>
              </button>

              {/* Run Container Button */}
              <button
                id="devops-run-container-btn"
                onClick={() => {
                  setRunPreselectedImage('');
                  setIsRunDialogOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                title="Deploy and run a new container instance (Ctrl+N)"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Container</span>
                <kbd className="hidden md:inline px-1 py-0.2 bg-black/30 rounded-xs text-[9px] text-emerald-200 border border-emerald-400/30">
                  Ctrl+N
                </kbd>
              </button>

              {/* Container PTY Shell */}
              <button
                id="devops-open-terminal-btn"
                onClick={() => {
                  createTerminalTab('Container Shell');
                  setActiveModule('terminal-deck');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xs bg-[#030917] hover:bg-[#0a1630] border border-cyan-950 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
                title="Open Global Container PTY Shell"
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Shell PTY</span>
              </button>

              {/* Refresh Daemon */}
              <button
                id="devops-refresh-btn"
                onClick={loadData}
                className="p-2 rounded-xs bg-[#030917] hover:bg-[#0a1630] border border-cyan-950 text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Refresh Container Daemon Status"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Reset to Factory Defaults */}
              <button
                id="devops-reset-btn"
                onClick={handleResetArsenal}
                className="p-2 rounded-xs bg-[#030917] hover:bg-rose-950/40 border border-cyan-950 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 transition-colors"
                title="Restore Default Containers and Images"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Mode Tabs & Filter / Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Tabs (Workloads vs Local Images) */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xs bg-[#030917] border border-cyan-950 p-0.5">
              <button
                onClick={() => setActiveTab('CONTAINERS')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono font-bold uppercase transition-all ${
                  activeTab === 'CONTAINERS'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Container className="w-3.5 h-3.5" />
                <span>Containers ({containers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('IMAGES')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xs text-xs font-mono font-bold uppercase transition-all ${
                  activeTab === 'IMAGES'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Images ({images.length})</span>
              </button>
            </div>

            {/* Secondary Filter for Containers */}
            {activeTab === 'CONTAINERS' && (
              <div className="flex items-center gap-1 ml-2">
                {(['ALL', 'RUNNING', 'EXITED'] as StatusFilter[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1.5 rounded-xs text-xs font-mono font-bold transition-colors ${
                      filterStatus === st
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                        : 'text-slate-400 hover:text-slate-200 bg-[#071126] border border-cyan-950'
                    }`}
                  >
                    {st} (
                    {st === 'ALL'
                      ? containers.length
                      : st === 'RUNNING'
                      ? runningCount
                      : containers.length - runningCount}
                    )
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input with shortcut hint */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#071126] border border-cyan-500/30 rounded-xs max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={
                activeTab === 'CONTAINERS'
                  ? 'Search containers, images, ports, command... (/)'
                  : 'Search images by repository, tag, description... (/)'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-slate-500 hover:text-slate-300"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            ) : (
              <kbd className="hidden sm:inline px-1 py-0.2 bg-black/40 rounded-xs text-[10px] font-mono text-slate-500 border border-cyan-950">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* 3. Main View Area */}
        {activeTab === 'CONTAINERS' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Container List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider px-1 flex justify-between items-center">
                <span>Active Workloads</span>
                <span>
                  {filteredContainers.length} of {containers.length} Matched
                </span>
              </div>

              {filteredContainers.length === 0 ? (
                <div className="p-8 text-center bg-[#071126] border border-dashed border-cyan-950 rounded-md font-mono space-y-3">
                  <Container className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No container instances match your criteria.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('ALL');
                      }}
                      className="px-3 py-1 bg-[#030917] border border-cyan-950 rounded-xs text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      Clear Filters
                    </button>
                    <button
                      onClick={() => setIsRunDialogOpen(true)}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-xs text-xs text-white"
                    >
                      + Run New Container
                    </button>
                  </div>
                </div>
              ) : (
                filteredContainers.map((container) => {
                  const isSelected = container.id === selectedContainerId;
                  const isRunning = container.status === 'running';

                  return (
                    <div
                      key={container.id}
                      onClick={() => {
                        setSelectedContainerId(container.id);
                        loadLogs(container.id);
                      }}
                      className={`p-4 rounded-md border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#09152e] border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-[#071126] border-cyan-950 hover:border-cyan-500/40 hover:bg-[#0a1733]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-bold font-mono text-white truncate">
                              {container.name}
                            </h3>
                            {container.isCustom && (
                              <span className="px-1.5 py-0.2 rounded-xs text-[9px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <code className="text-[11px] font-mono text-cyan-400 truncate block mt-0.5">
                            {container.image}
                          </code>
                        </div>

                        <StatusPill
                          status={isRunning ? 'healthy' : 'idle'}
                          label={isRunning ? 'RUNNING' : 'EXITED'}
                          pulse={isRunning}
                        />
                      </div>

                      {/* Port tags & metrics */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2.5 border-t border-cyan-950">
                        <span className="truncate max-w-[140px]">
                          {container.ports.length > 0 ? (
                            <span className="text-slate-300">
                              Port:{' '}
                              {typeof container.ports[0] === 'object'
                                ? `${container.ports[0].hostPort}:${container.ports[0].containerPort}`
                                : container.ports[0]}
                            </span>
                          ) : (
                            <span className="text-slate-500">{container.statusText || 'Host Net'}</span>
                          )}
                        </span>
                        <span className="text-cyan-300 font-mono">
                          CPU: {container.cpuUsagePercent || 0}% | {container.memoryUsageMb || 0} MB
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Selected Container Inspection & Logs (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {selectedContainer ? (
                <>
                  {/* Action Bar for Container */}
                  <div className="bg-[#071126] border border-cyan-500/30 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold font-sans text-white tracking-wide">
                          {selectedContainer.name}
                        </h3>
                        <StatusPill
                          status={selectedContainer.status === 'running' ? 'healthy' : 'idle'}
                          label={selectedContainer.status.toUpperCase()}
                          pulse={selectedContainer.status === 'running'}
                        />
                      </div>
                      <span className="text-xs font-mono text-cyan-400 block mt-0.5">
                        ID: {selectedContainer.id} • {selectedContainer.image}
                      </span>
                    </div>

                    {/* Operational Action Controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedContainer.status === 'running' ? (
                        <button
                          id="stop-container-trigger-btn"
                          onClick={() => setContainerToStop(selectedContainer)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-amber-950/70 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold hover:bg-amber-900/70 transition-colors shadow-xs"
                          title="Halt Container (SIGTERM / SIGKILL)"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          id="start-container-trigger-btn"
                          onClick={() => handleQuickStart(selectedContainer)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold hover:bg-emerald-900/70 transition-colors shadow-xs"
                          title="Start Container"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleQuickRestart(selectedContainer)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xs bg-[#030917] border border-cyan-950 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                        title="Restart Container"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Restart</span>
                      </button>

                      <button
                        onClick={() => handleLaunchTerminalPTY(selectedContainer)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xs bg-[#030917] border border-cyan-950 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                        title="Exec PTY Shell"
                      >
                        <Terminal className="w-3.5 h-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Exec</span>
                      </button>

                      <button
                        id="delete-container-trigger-btn"
                        onClick={() => setContainerToDelete(selectedContainer)}
                        className="p-1.5 rounded-xs bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 transition-colors"
                        title="Purge Container"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Container Telemetry Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-[#030917] border border-cyan-950 rounded-xs p-2.5">
                      <span className="text-slate-500 text-[10px] block uppercase flex items-center gap-1">
                        <Network className="w-3 h-3 text-cyan-400" />
                        PORTS BINDING
                      </span>
                      <span className="text-cyan-400 font-bold mt-0.5 block truncate">
                        {selectedContainer.ports.length > 0
                          ? typeof selectedContainer.ports[0] === 'object'
                            ? `${selectedContainer.ports[0].hostPort}:${selectedContainer.ports[0].containerPort}/${selectedContainer.ports[0].protocol}`
                            : selectedContainer.ports[0]
                          : 'Host Network'}
                      </span>
                    </div>

                    <div className="bg-[#030917] border border-cyan-950 rounded-xs p-2.5">
                      <span className="text-slate-500 text-[10px] block uppercase flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-emerald-400" />
                        CPU CONSUMPTION
                      </span>
                      <span className="text-white font-bold mt-0.5 block">
                        {selectedContainer.cpuUsagePercent || 0}%
                      </span>
                    </div>

                    <div className="bg-[#030917] border border-cyan-950 rounded-xs p-2.5">
                      <span className="text-slate-500 text-[10px] block uppercase flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-blue-400" />
                        RAM BUFFER
                      </span>
                      <span className="text-white font-bold mt-0.5 block">
                        {selectedContainer.memoryUsageMb || 0} MB
                      </span>
                    </div>

                    <div className="bg-[#030917] border border-cyan-950 rounded-xs p-2.5">
                      <span className="text-slate-500 text-[10px] block uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        STATUS & UPTIME
                      </span>
                      <span className="text-slate-300 text-[11px] truncate block mt-0.5">
                        {selectedContainer.statusText || selectedContainer.status}
                      </span>
                    </div>
                  </div>

                  {/* Command / Entrypoint info */}
                  <div className="bg-[#030917] border border-cyan-950 rounded-xs p-3 font-mono text-xs flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] uppercase">ENTRYPOINT CMD:</span>
                    <code className="text-slate-300 text-[11px] truncate max-w-md ml-2">
                      {selectedContainer.command || '/bin/sh -c "exec entrypoint"'}
                    </code>
                  </div>

                  {/* Live Logs Viewer */}
                  <div className="bg-[#071126] border border-cyan-500/20 rounded-md p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-cyan-950 mb-3 text-xs font-mono">
                      <div className="flex items-center gap-2 text-slate-300 font-bold">
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <span>CONTAINER STDIN/STDOUT STREAM</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Auto-refresh toggle */}
                        <button
                          onClick={() => setAutoRefreshLogs(!autoRefreshLogs)}
                          className={`px-2 py-0.5 rounded-xs text-[10px] font-mono border transition-all ${
                            autoRefreshLogs
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                              : 'bg-[#030917] text-slate-400 border-cyan-950'
                          }`}
                        >
                          Auto-Poll: {autoRefreshLogs ? 'ON (3s)' : 'OFF'}
                        </button>

                        {/* Copy Logs */}
                        <button
                          onClick={handleCopyLogs}
                          className="text-slate-400 hover:text-white p-1 rounded-xs hover:bg-[#030917]"
                          title="Copy Log Buffer"
                        >
                          {copiedLogs ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Manual Refresh */}
                        <button
                          onClick={() => loadLogs(selectedContainer.id)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Refresh</span>
                        </button>
                      </div>
                    </div>

                    {/* Filter in logs */}
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Filter inside log output..."
                        value={logFilterQuery}
                        onChange={(e) => setLogFilterQuery(e.target.value)}
                        className="w-full bg-[#030917] border border-cyan-950 rounded-xs px-2.5 py-1 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-hidden focus:border-cyan-500/40"
                      />
                    </div>

                    <pre className="font-mono text-xs text-slate-300 overflow-x-auto p-3 bg-[#020612] rounded-xs border border-cyan-950 leading-relaxed max-h-64 overflow-y-auto">
                      {loadingLogs
                        ? 'Reading stream from Docker socket...'
                        : displayLogs || 'No log messages received on stdout/stderr.'}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center bg-[#071126] border border-cyan-950 rounded-md font-mono text-slate-400 space-y-2">
                  <Container className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-xs">Select a container instance to inspect stream logs & resource limits.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 4. Local Images Registry Tab */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
              <span>Local OCI Container Images</span>
              <span>{filteredImages.length} Images Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="bg-[#071126] border border-cyan-950 hover:border-cyan-500/40 rounded-md p-4 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold font-mono text-white truncate">
                          {img.repository}
                        </h3>
                        <span className="inline-block px-1.5 py-0.2 rounded-xs text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/30 mt-1">
                          tag: {img.tag}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {img.sizeMb} MB
                      </span>
                    </div>

                    <p className="text-xs font-mono text-slate-400 line-clamp-2">
                      {img.description || 'OCI standard container image staged in enclave.'}
                    </p>

                    <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-cyan-950 flex justify-between">
                      <span className="truncate max-w-[150px]">{img.digest?.substring(0, 19)}...</span>
                      <span>Created: {img.created.split('T')[0]}</span>
                    </div>
                  </div>

                  {/* Actions on Image */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-cyan-950">
                    <button
                      onClick={() => handleLaunchFromImage(img)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 hover:text-white rounded-xs text-xs font-mono font-bold transition-all shadow-xs"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run Container</span>
                    </button>

                    <button
                      onClick={() => handleRemoveImage(img)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-[#030917] rounded-xs transition-colors"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Modals & Dialogs */}
      <PullImageDialog
        isOpen={isPullDialogOpen}
        onClose={() => setIsPullDialogOpen(false)}
        onImagePulled={loadData}
      />

      <RunContainerDialog
        isOpen={isRunDialogOpen}
        onClose={() => setIsRunDialogOpen(false)}
        onContainerLaunched={loadData}
        existingContainers={containers}
        preselectedImage={runPreselectedImage}
      />

      <StopContainerModal
        container={containerToStop}
        isOpen={Boolean(containerToStop)}
        onClose={() => setContainerToStop(null)}
        onStopped={loadData}
      />

      <DeleteContainerModal
        container={containerToDelete}
        isOpen={Boolean(containerToDelete)}
        onClose={() => setContainerToDelete(null)}
        onDeleted={loadData}
      />
    </div>
  );
};
