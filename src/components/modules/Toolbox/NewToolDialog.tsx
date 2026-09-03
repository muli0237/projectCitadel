import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Wrench,
  Terminal,
  Shield,
  Zap,
  Code2,
  Folder,
  Layers,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { ToolCategory, ToolDefinition, RequiredPermission, SafeLaunchTemplate } from '../../../types';

interface NewToolDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (toolData: Partial<ToolDefinition>) => Promise<boolean>;
  existingBinaries: string[];
}

interface ToolPreset {
  id: string;
  name: string;
  binaryName: string;
  category: ToolCategory;
  description: string;
  requiredPermission: RequiredPermission;
  binaryPath: string;
  version: string;
  safeLaunchTemplates: SafeLaunchTemplate[];
}

const PRESET_TEMPLATES: ToolPreset[] = [
  {
    id: 'preset-python',
    name: 'Python Tactical Recon Script',
    binaryName: 'python3',
    category: 'Forensics & Analysis',
    description: 'Custom Python network reconnaissance and passive DNS resolution utility.',
    requiredPermission: 'Standard User',
    binaryPath: '/usr/bin/python3',
    version: '3.12.3',
    safeLaunchTemplates: [
      {
        name: 'Target Recon & Banner Grab',
        description: 'Passive banner grabbing and port enumeration script with target IP argument.',
        argsTemplate: 'scripts/recon.py --target {target} --timeout 5',
        requiresElevation: false,
      },
    ],
  },
  {
    id: 'preset-rust',
    name: 'RustScan Fast Port Scanner',
    binaryName: 'rustscan',
    category: 'Network Diagnostics',
    description: 'Modern asynchronous port scanner that pipes detected open ports directly into nmap.',
    requiredPermission: 'Raw Socket / Net Admin',
    binaryPath: '/usr/local/bin/rustscan',
    version: 'v2.2.3',
    safeLaunchTemplates: [
      {
        name: 'Ultra-Fast Subnet Sweep',
        description: 'Scan all 65,535 ports on target host within 3 seconds.',
        argsTemplate: '-a {target} --ulimit 5000 -g',
        requiresElevation: false,
      },
      {
        name: 'Nmap Pipe Pipeline',
        description: 'Finds open ports then runs nmap service scripts on open targets.',
        argsTemplate: '-a {target} -- -sV -sC',
        requiresElevation: true,
      },
    ],
  },
  {
    id: 'preset-bash',
    name: 'Citadel Enclave Audit Shell Runner',
    binaryName: 'bash',
    category: 'Development & Binaries',
    description: 'Hardened bash script pipeline for verifying cryptographic enclave hashes.',
    requiredPermission: 'Standard User',
    binaryPath: '/bin/bash',
    version: '5.2.21',
    safeLaunchTemplates: [
      {
        name: 'Local Enclave Integrity Check',
        description: 'Validates SHA256 checksums of authorized mission binaries.',
        argsTemplate: 'scripts/audit_enclave.sh --host {target}',
        requiresElevation: false,
      },
    ],
  },
  {
    id: 'preset-curl',
    name: 'HTTP Endpoint Prober (cURL)',
    binaryName: 'curl',
    category: 'Web Testing',
    description: 'Command line tool for transferring data with URLs using standard protocols.',
    requiredPermission: 'Standard User',
    binaryPath: '/usr/bin/curl',
    version: '8.5.0',
    safeLaunchTemplates: [
      {
        name: 'Header & TLS Security Inspection',
        description: 'Inspect HTTPS response headers, HSTS policy, and TLS handshake metrics.',
        argsTemplate: '-I -sS -v https://{target}',
        requiresElevation: false,
      },
    ],
  },
  {
    id: 'preset-container',
    name: 'Podman Enclave Health Inspector',
    binaryName: 'podman',
    category: 'Containers & Infrastructure',
    description: 'Rootless container engine inspection utility for isolated microservices.',
    requiredPermission: 'Standard User',
    binaryPath: '/usr/bin/podman',
    version: '4.9.3',
    safeLaunchTemplates: [
      {
        name: 'Container Audit Status',
        description: 'Queries active container health status and exposed port bindings.',
        argsTemplate: 'ps --format "{{.ID}} {{.Names}} {{.Status}}" --filter label=target={target}',
        requiresElevation: false,
      },
    ],
  },
];

const CATEGORIES: ToolCategory[] = [
  'Network Diagnostics',
  'Web Testing',
  'Forensics & Analysis',
  'Wireless Diagnostics',
  'Password Auditing (Authorized)',
  'Development & Binaries',
  'Containers & Infrastructure',
  'Data Science & CLI',
];

const PERMISSIONS: RequiredPermission[] = [
  'Standard User',
  'Requires Sudo / Root',
  'Raw Socket / Net Admin',
  'Docker Daemon',
];

export const NewToolDialog: React.FC<NewToolDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingBinaries,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('preset-python');
  const [name, setName] = useState('');
  const [binaryName, setBinaryName] = useState('');
  const [category, setCategory] = useState<ToolCategory>('Network Diagnostics');
  const [description, setDescription] = useState('');
  const [binaryPath, setBinaryPath] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [requiredPermission, setRequiredPermission] = useState<RequiredPermission>('Standard User');
  const [docUrl, setDocUrl] = useState('');

  // Safe launch templates state
  const [templateName, setTemplateName] = useState('Default Scoped Scan');
  const [templateDescription, setTemplateDescription] = useState('Standard non-destructive probe against authorized target host.');
  const [templateArgs, setTemplateArgs] = useState('-h {target}');
  const [templateRequiresElevation, setTemplateRequiresElevation] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Apply preset
  const applyPreset = (preset: ToolPreset) => {
    setSelectedPreset(preset.id);
    setName(preset.name);
    setBinaryName(preset.binaryName);
    setCategory(preset.category);
    setDescription(preset.description);
    setBinaryPath(preset.binaryPath);
    setVersion(preset.version);
    setRequiredPermission(preset.requiredPermission);
    setDocUrl(`https://linux.die.net/man/1/${preset.binaryName}`);

    if (preset.safeLaunchTemplates.length > 0) {
      const primary = preset.safeLaunchTemplates[0];
      setTemplateName(primary.name);
      setTemplateDescription(primary.description);
      setTemplateArgs(primary.argsTemplate);
      setTemplateRequiresElevation(primary.requiresElevation);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const defaultPreset = PRESET_TEMPLATES[0];
      applyPreset(defaultPreset);
      setValidationError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time validation
  const validateForm = (): string | null => {
    if (!name.trim()) return 'Tool display name cannot be empty.';
    if (!binaryName.trim()) return 'Binary executable command name cannot be empty.';
    if (binaryName.includes(' ') && !binaryName.startsWith('python') && !binaryName.startsWith('bash')) {
      return 'Binary name must be an executable binary (e.g. "rustscan", "nikto", "curl").';
    }
    const cleanBinary = binaryName.trim().toLowerCase();
    if (existingBinaries.map((b) => b.toLowerCase()).includes(cleanBinary)) {
      return `Binary "${binaryName}" is already registered in this arsenal.`;
    }
    if (!templateArgs.trim()) {
      return 'Safe launch template argument string cannot be empty.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const toolData: Partial<ToolDefinition> = {
        name: name.trim(),
        binaryName: binaryName.trim(),
        category,
        description: description.trim() || 'Custom enclave tool registered in Citadel workspace.',
        binaryPath: binaryPath.trim() || `/usr/local/bin/${binaryName.trim()}`,
        version: version.trim() || 'v1.0.0',
        requiredPermission,
        docUrl: docUrl.trim() || `https://man7.org/linux/man-pages/dir_all_by_name.html`,
        helpCommand: `${binaryName.trim()} --help`,
        installed: true,
        isAvailable: true,
        isCustom: true,
        safeLaunchTemplates: [
          {
            name: templateName.trim() || 'Default Scoped Execution',
            description: templateDescription.trim() || 'Pre-configured safe execution template.',
            argsTemplate: templateArgs.trim(),
            requiresElevation: templateRequiresElevation,
          },
        ],
      };

      const success = await onSubmit(toolData);
      if (success) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="new-tool-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="new-tool-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#071126] border border-cyan-500/40 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#030917] border-b border-cyan-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xs bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                Register Tool in Tactical Arsenal
              </h2>
              <p className="text-[10px] font-mono text-cyan-400">
                Works in Native Desktop & Preview Environments • Persistent Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Blueprint Presets Bar */}
        <div className="p-4 bg-[#050c1d] border-b border-cyan-950">
          <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-2">
            SELECT BLUEPRINT PRESET OR CUSTOMIZE:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {PRESET_TEMPLATES.map((p) => {
              const isSelected = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`px-2 py-1.5 rounded-xs border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/90 border-cyan-500/60 text-cyan-200 ring-1 ring-cyan-500/30'
                      : 'bg-[#030917] border-cyan-950 text-slate-400 hover:text-slate-200 hover:border-cyan-800'
                  }`}
                >
                  <span className="text-[11px] font-mono font-bold truncate block">{p.binaryName}</span>
                  <span className="text-[9px] font-mono text-slate-500 truncate block mt-0.5">{p.category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {validationError && (
            <div className="flex items-start gap-2 p-2.5 rounded-xs bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Row 1: Tool Name & Binary Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Tool Display Name <span className="text-cyan-400">*</span>
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setValidationError(null);
                }}
                placeholder="e.g., Fast Recon Prober"
                required
                className="w-full px-3 py-1.5 rounded-xs bg-[#030917] border border-cyan-500/30 text-white font-mono text-xs placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Binary Executable ($cmd) <span className="text-cyan-400">*</span>
              </label>
              <div className="flex items-center px-3 py-1.5 rounded-xs bg-[#030917] border border-cyan-500/30 focus-within:border-cyan-400">
                <span className="text-cyan-500 font-mono text-xs select-none mr-1.5">$</span>
                <input
                  type="text"
                  value={binaryName}
                  onChange={(e) => {
                    setBinaryName(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="e.g., rustscan or python3"
                  required
                  className="w-full bg-transparent border-none text-white font-mono text-xs placeholder-slate-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Category & Permission */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Arsenal Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ToolCategory)}
                className="w-full px-3 py-1.5 rounded-xs bg-[#030917] border border-cyan-500/30 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#071126] text-slate-200">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                Required Elevation Boundary
              </label>
              <select
                value={requiredPermission}
                onChange={(e) => setRequiredPermission(e.target.value as RequiredPermission)}
                className="w-full px-3 py-1.5 rounded-xs bg-[#030917] border border-cyan-500/30 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-400"
              >
                {PERMISSIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#071126] text-slate-200">
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
              Description & Operational Scope
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="State utility scope, expected target inputs, and verification guidelines..."
              className="w-full px-3 py-1.5 rounded-xs bg-[#030917] border border-cyan-500/30 text-white font-mono text-xs placeholder-slate-600 focus:outline-hidden focus:border-cyan-400"
            />
          </div>

          {/* Optional: Binary Path & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Filesystem Binary Path
              </label>
              <input
                type="text"
                value={binaryPath}
                onChange={(e) => setBinaryPath(e.target.value)}
                placeholder="/usr/local/bin/binary"
                className="w-full px-2.5 py-1 rounded-xs bg-[#030917] border border-cyan-500/30 text-white font-mono text-xs placeholder-slate-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Version Tag
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0.0"
                className="w-full px-2.5 py-1 rounded-xs bg-[#030917] border border-cyan-500/30 text-white font-mono text-xs placeholder-slate-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section: Safe Execution Launch Template */}
          <div className="p-3.5 bg-[#030917] border border-cyan-500/30 rounded-xs space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Default Safe Launch Template</span>
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={templateRequiresElevation}
                  onChange={(e) => setTemplateRequiresElevation(e.target.checked)}
                  className="rounded border-gray-700 bg-gray-900 text-cyan-500 focus:ring-0"
                />
                <span>Requires Root (sudo)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Template Label
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Scoped Target Audit"
                  className="w-full px-2.5 py-1 rounded-xs bg-[#071126] border border-cyan-950 text-white font-mono text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Template Arguments (use <span className="text-cyan-400">{'{target}'}</span> placeholder)
                </label>
                <input
                  type="text"
                  value={templateArgs}
                  onChange={(e) => setTemplateArgs(e.target.value)}
                  placeholder="e.g. --host {target} -v"
                  className="w-full px-2.5 py-1 rounded-xs bg-[#071126] border border-cyan-950 text-cyan-300 font-mono text-xs focus:outline-hidden"
                />
              </div>
            </div>

            {/* Live Command Preview Box */}
            <div className="p-2 bg-[#02050c] border border-cyan-950 rounded-xs">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                DISPATCH COMMAND PREVIEW
              </span>
              <code className="text-xs font-mono text-cyan-300 block truncate">
                {templateRequiresElevation ? 'sudo ' : ''}
                {binaryName || 'tool'} {templateArgs.replace('{target}', '10.0.4.15')}
              </code>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-cyan-950">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xs border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xs bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Registering...' : 'Add Tool to Arsenal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
