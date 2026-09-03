import React, { useState, useEffect } from 'react';
import {
  FilePlus,
  X,
  Check,
  AlertCircle,
  Code2,
  FileCode,
  Terminal,
  FileText,
  FileJson,
  Settings,
} from 'lucide-react';
import { detectLanguageByPath } from '../../../data/defaultWorkspaceFiles';

interface TemplateOption {
  label: string;
  extension: string;
  defaultPath: string;
  icon: React.FC<{ className?: string }>;
  content: string;
}

const TEMPLATES: TemplateOption[] = [
  {
    label: 'Rust Source',
    extension: '.rs',
    defaultPath: 'src/module.rs',
    icon: Code2,
    content: `// Citadel Enclave Rust Module\n\npub fn execute() -> Result<(), Box<dyn std::error::Error>> {\n    println!("Executing enclave task...");\n    Ok(())\n}\n`,
  },
  {
    label: 'Python Script',
    extension: '.py',
    defaultPath: 'scripts/recon.py',
    icon: Terminal,
    content: `#!/usr/bin/env python3\n"""\nCitadel Security Assessment Script\n"""\nimport sys\nimport os\n\ndef main():\n    print("[*] Enclave task initialized.")\n\nif __name__ == '__main__':\n    main()\n`,
  },
  {
    label: 'Shell Script',
    extension: '.sh',
    defaultPath: 'scripts/deploy.sh',
    icon: Terminal,
    content: `#!/usr/bin/env bash\nset -euo pipefail\necho "[+] Running Citadel Enclave Task..."\n`,
  },
  {
    label: 'JSON Config',
    extension: '.json',
    defaultPath: 'configs/settings.json',
    icon: FileJson,
    content: `{\n  "version": "1.0",\n  "enabled": true,\n  "target": "local-airgap"\n}\n`,
  },
  {
    label: 'TypeScript',
    extension: '.ts',
    defaultPath: 'src/types.ts',
    icon: FileCode,
    content: `export interface EnclaveConfig {\n  id: string;\n  active: boolean;\n  timestamp: string;\n}\n`,
  },
  {
    label: 'Markdown Doc',
    extension: '.md',
    defaultPath: 'docs/runbook.md',
    icon: FileText,
    content: `# Enclave Runbook\n\n## Objective\nDocument procedures and execution instructions.\n`,
  },
];

interface NewFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (path: string, content?: string) => Promise<boolean>;
  existingPaths: string[];
  validatePath: (path: string, existing: string[]) => { valid: boolean; error?: string; normalizedPath?: string };
}

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  isOpen,
  onClose,
  onCreate,
  existingPaths,
  validatePath,
}) => {
  const [filePath, setFilePath] = useState('src/service.rs');
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFilePath('src/service.rs');
      setSelectedTemplateIndex(0);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTemplateSelect = (index: number) => {
    setSelectedTemplateIndex(index);
    const tmpl = TEMPLATES[index];
    if (tmpl) {
      // If user hasn't edited much or wants suggested path
      setFilePath(tmpl.defaultPath);
      setError(null);
    }
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilePath(val);
    const res = validatePath(val, existingPaths);
    if (!res.valid) {
      setError(res.error || 'Invalid file path');
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePath(filePath, existingPaths);
    if (!validation.valid || !validation.normalizedPath) {
      setError(validation.error || 'Please provide a valid file path.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const templateContent =
      selectedTemplateIndex !== null && TEMPLATES[selectedTemplateIndex]
        ? TEMPLATES[selectedTemplateIndex].content
        : undefined;

    const success = await onCreate(validation.normalizedPath, templateContent);
    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const detectedLang = detectLanguageByPath(filePath);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-lg bg-[#0d1017] border border-cyan-500/40 rounded-lg shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#12161f] border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <FilePlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-gray-100">
              Create New Workspace File
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Templates chips */}
          <div>
            <label className="block text-[11px] font-tech uppercase tracking-wider text-gray-400 mb-1.5">
              Template Blueprint
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATES.map((tmpl, idx) => {
                const Icon = tmpl.icon;
                const isSelected = selectedTemplateIndex === idx;
                return (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => handleTemplateSelect(idx)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs font-mono text-left transition-all border ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-300 shadow-xs shadow-cyan-500/20'
                        : 'bg-[#12161f] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tmpl.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* File Path Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-tech uppercase tracking-wider text-gray-400">
                Relative File Path
              </label>
              <span className="text-[10px] font-mono text-cyan-400">
                Language: {detectedLang.toUpperCase()}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={filePath}
                onChange={handlePathChange}
                placeholder="e.g. src/utils/crypto.rs or scripts/recon.py"
                className={`w-full px-3 py-2 bg-[#080a0f] border rounded font-mono text-xs text-gray-100 placeholder-gray-600 focus:outline-hidden transition-colors ${
                  error
                    ? 'border-rose-500/80 focus:border-rose-500 shadow-xs shadow-rose-950/30'
                    : 'border-gray-700 focus:border-cyan-500/80'
                }`}
                autoFocus
              />
            </div>
            <p className="mt-1 text-[10px] font-mono text-gray-500">
              Directories will be created automatically. Traversal tokens (<code className="text-gray-400">..</code>) are blocked.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-rose-950/40 border border-rose-600/40 text-rose-300 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-300 text-xs font-tech transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !!error}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-tech font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm shadow-cyan-900/40"
            >
              {isSubmitting ? (
                <span>Writing to Disk...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Create File</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
