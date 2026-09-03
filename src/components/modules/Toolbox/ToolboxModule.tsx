import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  HelpCircle,
  ExternalLink,
  Shield,
  Clock,
  Terminal,
  Layers,
  ChevronRight,
  Target,
  Zap,
  Lock,
  RefreshCw,
  Radio,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Sliders,
  Filter,
  Sparkles,
} from 'lucide-react';
import { useCitadelStore } from '../../../store/useCitadelStore';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import { ToolCategory, ToolDefinition, ToolExecutionRequest } from '../../../types';
import { StatusPill } from '../../common/StatusPill';
import { NewToolDialog } from './NewToolDialog';
import { DeleteToolModal } from './DeleteToolModal';

import secopsCardSvg from '../../../assets/images/card_secops_vector.svg';
import networkCardSvg from '../../../assets/images/card_network_vector.svg';

type ToolStatusFilter = 'ALL' | 'INSTALLED' | 'CUSTOM' | 'ELEVATED';

export const ToolboxModule: React.FC = () => {
  const {
    showCommandPreview,
    activeProject,
    workspace,
    createTerminalTab,
    setActiveModule,
    showToast,
    authorizationAcknowledged,
  } = useCitadelStore();

  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<ToolStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [targetInput, setTargetInput] = useState('10.0.4.15');
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);

  // Modals state
  const [isNewToolModalOpen, setIsNewToolModalOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<ToolDefinition | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadTools = async () => {
    setIsRefreshing(true);
    try {
      const registry = await bridge.getToolRegistry();
      setTools(registry);
      if (registry.length > 0) {
        setSelectedTool((prev) => {
          if (!prev) return registry[0];
          const found = registry.find((t) => t.id === prev.id);
          return found || registry[0];
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // Keyboard shortcut handler (Ctrl+N / Cmd+N for new tool, / for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input/textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewToolModalOpen(true);
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories: ToolCategory[] = [
    'Network Diagnostics',
    'Web Testing',
    'Forensics & Analysis',
    'Password Auditing (Authorized)',
    'Containers & Infrastructure',
    'Data Science & CLI',
    'Development & Binaries',
  ];

  // Filtered tools computation
  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return tools.filter((t) => {
      // Category match
      const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
      if (!matchesCat) return false;

      // Status / Elevation match
      if (statusFilter === 'INSTALLED') {
        if (!(t.installed ?? t.isAvailable)) return false;
      } else if (statusFilter === 'CUSTOM') {
        if (!t.isCustom) return false;
      } else if (statusFilter === 'ELEVATED') {
        const hasElevatedTemplate = t.safeLaunchTemplates.some((tpl) => tpl.requiresElevation);
        const hasSudoPerm = t.requiredPermission.toLowerCase().includes('sudo') || t.requiredPermission.toLowerCase().includes('root');
        if (!hasElevatedTemplate && !hasSudoPerm) return false;
      }

      // Search match across name, binary, description, template labels & args
      if (query) {
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesBinary = t.binaryName.toLowerCase().includes(query);
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesCatText = t.category.toLowerCase().includes(query);
        const matchesTemplate = t.safeLaunchTemplates.some(
          (tpl) =>
            tpl.name.toLowerCase().includes(query) ||
            tpl.argsTemplate.toLowerCase().includes(query) ||
            tpl.description.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesBinary && !matchesDesc && !matchesCatText && !matchesTemplate) {
          return false;
        }
      }

      return true;
    });
  }, [tools, selectedCategory, statusFilter, searchQuery]);

  // Handle registering a new tool
  const handleCreateTool = async (toolData: Partial<ToolDefinition>): Promise<boolean> => {
    try {
      const res = await bridge.addTool(toolData);
      if (res.success && res.data) {
        const updated = await bridge.getToolRegistry();
        setTools(updated);
        setSelectedTool(res.data);
        showToast({
          type: 'success',
          title: 'Tool Registered to Arsenal',
          message: `${res.data.name} ($${res.data.binaryName}) is ready for execution.`,
        });
        return true;
      } else {
        showToast({
          type: 'error',
          title: 'Registration Failed',
          message: res.error || 'Could not register tool definition.',
        });
        return false;
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Registration Error',
        message: e?.message || 'Failed to save tool to enclave.',
      });
      return false;
    }
  };

  // Handle deleting tool
  const handleDeleteTool = async (toolId: string): Promise<boolean> => {
    try {
      const res = await bridge.deleteTool(toolId);
      if (res.success) {
        const updated = await bridge.getToolRegistry();
        setTools(updated);
        if (selectedTool?.id === toolId) {
          setSelectedTool(updated[0] || null);
        }
        showToast({
          type: 'info',
          title: 'Tool Unregistered',
          message: 'Tool definition removed from workspace arsenal.',
        });
        return true;
      } else {
        showToast({
          type: 'error',
          title: 'Removal Failed',
          message: res.error || 'Could not remove tool.',
        });
        return false;
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Error Removing Tool',
        message: e?.message || 'Failed to delete tool.',
      });
      return false;
    }
  };

  // Handle resetting registry to default
  const handleResetRegistry = async () => {
    if (confirm('Reset arsenal tools to default factory definitions? Any custom tools will be cleared.')) {
      const resetTools = await bridge.resetToolsToDefault();
      setTools(resetTools);
      setSelectedTool(resetTools[0] || null);
      showToast({
        type: 'info',
        title: 'Arsenal Reset',
        message: 'Tools restored to default factory security arsenal.',
      });
    }
  };

  const handleLaunchTemplate = (
    tool: ToolDefinition,
    template: ToolDefinition['safeLaunchTemplates'][0]
  ) => {
    const cmdArgs = template.argsTemplate.replace('{target}', targetInput || '10.0.4.15');
    const fullCommand = `${tool.binaryName} ${cmdArgs}`;

    showCommandPreview({
      tool,
      commandString: fullCommand,
      args: cmdArgs.split(' '),
      requiresElevation: template.requiresElevation,
      workingDirectory: activeProject?.path || workspace?.rootPath || '/tmp',
      targetDescription: targetInput || 'Authorized Scope Target',
      onExecute: async (runInTerminal) => {
        try {
          const req: ToolExecutionRequest = {
            toolId: tool.id,
            commandString: fullCommand,
            args: cmdArgs.split(' '),
            workingDirectory: activeProject?.path || workspace?.rootPath || '/tmp',
            runInTerminal,
            requiresElevation: template.requiresElevation,
            userConfirmationGranted: true,
            scopeAuthorizationAcknowledged: authorizationAcknowledged,
            targetDescription: targetInput,
          };

          const result = await bridge.executeApprovedTool(req);

          if (runInTerminal) {
            createTerminalTab(template.requiresElevation ? 'Kali Shell' : 'Project Shell');
            setActiveModule('terminal-deck');
          } else {
            showToast({
              type: 'success',
              title: `Execution Started: ${tool.name}`,
              message: `ID: ${result.executionId} • Dispatched to local sandboxed execution pool.`,
            });
          }
        } catch (e: any) {
          showToast({
            type: 'error',
            title: 'Execution Error',
            message: e?.message || 'Failed to dispatch command to sandbox.',
          });
        }
      },
    });
  };

  const customToolsCount = tools.filter((t) => t.isCustom).length;
  const isDesktopMode = isTauriEnvironment();

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent text-slate-200 relative">
      <div className="relative z-10 space-y-6">
        {/* 1. Tactical Security Arsenal Header */}
        <div className="relative overflow-hidden rounded-md border border-cyan-500/30 bg-[#071126]/90 p-5 shadow-xl backdrop-blur-md">
          <div
            className="absolute top-0 right-0 w-48 h-full opacity-15 pointer-events-none bg-contain bg-no-repeat bg-right"
            style={{ backgroundImage: `url(${networkCardSvg})` }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-xs bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg font-oxanium font-bold text-white uppercase tracking-[0.15em]">
                    Security Toolbox & Forensic Arsenal
                  </h1>
                  <StatusPill status="healthy" label="REGISTRY VERIFIED" />
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {isDesktopMode ? 'TAURI DESKTOP' : 'PREVIEW & SANDBOX'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Zero-synthetic tool execution • Strict safe argument templates • Dual Tauri & preview storage sync
                </p>
              </div>
            </div>

            {/* Target IP Scope input & Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-[#030917] border border-cyan-500/30 rounded-xs p-2">
                <Target className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                    AUDIT TARGET HOST / SCOPE
                  </span>
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    placeholder="10.0.4.15 or target.lan"
                    className="bg-transparent border-none text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden w-36 sm:w-44"
                  />
                </div>
              </div>

              {/* Add Tool Trigger Button */}
              <button
                onClick={() => setIsNewToolModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                title="Register a custom tool in the arsenal (Ctrl+N)"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tool</span>
              </button>

              {/* Refresh / Reload Arsenal */}
              <button
                onClick={loadTools}
                disabled={isRefreshing}
                className="p-2 rounded-xs bg-[#030917] hover:bg-[#09152e] border border-cyan-500/30 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Refresh Tool Registry from storage"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
              </button>

              {/* Reset to Factory Button */}
              <button
                onClick={handleResetRegistry}
                className="p-2 rounded-xs bg-[#030917] hover:bg-[#09152e] border border-cyan-500/30 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                title="Reset Arsenal to Factory Defaults"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Multi-Facet Search & Status Filters */}
        <div className="space-y-2.5">
          {/* Top Filter Bar: Search Input + Status Segments */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Real-time search bar */}
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#071126] border border-cyan-500/30 rounded-xs">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tools by name, $binary, description, or template flags (e.g. -sV, fuzz, https)... [/]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-slate-400 hover:text-white rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 hidden sm:inline-block">
                {filteredTools.length} {filteredTools.length === 1 ? 'match' : 'matches'}
              </span>
            </div>

            {/* Status Tabs (All, Installed, Custom, Elevated) */}
            <div className="flex items-center gap-1 bg-[#050b18] border border-cyan-500/30 rounded-xs p-1 shrink-0 overflow-x-auto">
              {(
                [
                  { id: 'ALL', label: 'All Arsenal', count: tools.length },
                  {
                    id: 'INSTALLED',
                    label: 'Installed',
                    count: tools.filter((t) => t.installed ?? t.isAvailable).length,
                  },
                  {
                    id: 'CUSTOM',
                    label: 'Custom',
                    count: customToolsCount,
                  },
                  {
                    id: 'ELEVATED',
                    label: 'Sudo Scope',
                    count: tools.filter(
                      (t) =>
                        t.safeLaunchTemplates.some((tpl) => tpl.requiresElevation) ||
                        t.requiredPermission.includes('Sudo')
                    ).length,
                  },
                ] as const
              ).map((tab) => {
                const isActive = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded ${
                        isActive ? 'bg-cyan-800 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1 rounded-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-[#071126] border border-cyan-950'
              }`}
            >
              ALL CATEGORIES
            </button>
            {categories.map((cat) => {
              const count = tools.filter((t) => t.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 bg-[#071126] border border-cyan-950'
                  }`}
                >
                  <span>{cat.toUpperCase()}</span>
                  {count > 0 && (
                    <span className="text-[10px] text-cyan-400 font-normal">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tools Grid & Inspector Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Tool Cards Grid (7 cols) */}
          <div className="lg:col-span-7">
            {filteredTools.length === 0 ? (
              <div className="p-8 text-center bg-[#071126] border border-cyan-500/20 rounded-md space-y-3">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-75" />
                <h3 className="text-sm font-oxanium font-bold text-white uppercase">
                  No Arsenal Tools Match Query
                </h3>
                <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                  No security utilities found matching &ldquo;{searchQuery}&rdquo; in {selectedCategory}.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                      setStatusFilter('ALL');
                    }}
                    className="px-3 py-1 rounded-xs bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-mono text-xs cursor-pointer hover:bg-cyan-900"
                  >
                    Clear Search & Filters
                  </button>
                  <button
                    onClick={() => setIsNewToolModalOpen(true)}
                    className="px-3 py-1 rounded-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Register New Tool</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredTools.map((tool) => {
                  const isSelected = selectedTool?.id === tool.id;
                  const isInstalled = tool.installed ?? tool.isAvailable;

                  return (
                    <div
                      key={tool.id}
                      onClick={() => setSelectedTool(tool)}
                      className={`group p-4 rounded-md border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#09152e] border-cyan-500/60 shadow-md ring-1 ring-cyan-500/30'
                          : 'bg-[#071126] border-cyan-950 hover:border-cyan-500/40 hover:bg-[#0a1733]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="truncate">
                            <h3 className="text-xs font-bold font-mono text-white truncate">
                              {tool.name}
                            </h3>
                            <code className="text-[10px] font-mono text-cyan-400 block mt-0.5 truncate">
                              ${tool.binaryName}
                            </code>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {tool.isCustom && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs border font-bold uppercase text-cyan-300 border-cyan-500/40 bg-cyan-950/40">
                                CUSTOM
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.5 rounded-xs border font-bold uppercase ${
                                isInstalled
                                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20'
                                  : 'text-amber-400 border-amber-500/40 bg-amber-950/20'
                              }`}
                            >
                              {isInstalled ? 'INSTALLED' : 'OPTIONAL'}
                            </span>

                            {tool.isCustom && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setToolToDelete(tool);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 rounded transition-opacity cursor-pointer ml-0.5"
                                title={`Delete ${tool.name} from arsenal`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs font-mono text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="pt-2.5 border-t border-cyan-950 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate max-w-[130px]">{tool.category}</span>
                        <span className="text-cyan-400 font-bold">
                          {tool.safeLaunchTemplates.length} {tool.safeLaunchTemplates.length === 1 ? 'Template' : 'Templates'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Tool Detail & Safe Launch Templates (5 cols) */}
          {selectedTool ? (
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#071126] border border-cyan-500/30 rounded-md p-5 shadow-lg space-y-4">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-cyan-950">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold font-oxanium text-white">
                        {selectedTool.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                        ${selectedTool.binaryName}
                      </span>
                      {selectedTool.isCustom && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cyan-900/60 text-cyan-200 border border-cyan-400/40">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-400">
                      {selectedTool.description}
                    </p>
                  </div>

                  {selectedTool.isCustom && (
                    <button
                      onClick={() => setToolToDelete(selectedTool)}
                      className="p-1.5 rounded-xs border border-rose-950 hover:border-rose-500/40 bg-rose-950/20 text-slate-400 hover:text-rose-300 transition-colors shrink-0 cursor-pointer"
                      title="Unregister tool from arsenal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Metadata badges */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded-xs bg-[#030917] border border-cyan-950">
                    <span className="text-[9px] text-slate-500 uppercase block">Elevation Level</span>
                    <span className="text-white font-bold">{selectedTool.requiredPermission}</span>
                  </div>
                  <div className="p-2 rounded-xs bg-[#030917] border border-cyan-950">
                    <span className="text-[9px] text-slate-500 uppercase block">Version / Release</span>
                    <span className="text-cyan-300 font-bold">{selectedTool.version || 'v1.0.0'}</span>
                  </div>
                </div>

                {/* Safe Launch Templates */}
                <div>
                  <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>SAFE EXECUTION TEMPLATES</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {selectedTool.safeLaunchTemplates.length} configured
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedTool.safeLaunchTemplates.map((template, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[#030917] border border-cyan-950 rounded-xs space-y-2 hover:border-cyan-500/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-white">
                            {template.name || template.label || 'Standard Execution'}
                          </span>
                          {template.requiresElevation && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-rose-950/40 text-rose-300 border border-rose-500/30">
                              SUDO REQUIRED
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-mono text-slate-400">
                          {template.description}
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-cyan-950 gap-2">
                          <code className="text-[10px] font-mono text-cyan-300 truncate max-w-[200px]">
                            {template.argsTemplate.replace('{target}', targetInput || '10.0.4.15')}
                          </code>
                          <button
                            onClick={() => handleLaunchTemplate(selectedTool, template)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-[11px] uppercase tracking-wider transition-colors shadow-xs shrink-0 cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-5 flex items-center justify-center p-8 bg-[#071126] border border-cyan-500/20 rounded-md text-slate-500 text-xs font-mono">
              Select a security tool from the arsenal to review operational templates.
            </div>
          )}
        </div>
      </div>

      {/* New Tool Registration Dialog */}
      <NewToolDialog
        isOpen={isNewToolModalOpen}
        onClose={() => setIsNewToolModalOpen(false)}
        onSubmit={handleCreateTool}
        existingBinaries={tools.map((t) => t.binaryName)}
      />

      {/* Delete Tool Confirmation Modal */}
      <DeleteToolModal
        isOpen={!!toolToDelete}
        tool={toolToDelete}
        onClose={() => setToolToDelete(null)}
        onConfirm={handleDeleteTool}
      />
    </div>
  );
};
