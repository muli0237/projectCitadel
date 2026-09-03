import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Terminal, Shield } from 'lucide-react';
import { ToolDefinition } from '../../../types';

interface DeleteToolModalProps {
  isOpen: boolean;
  tool: ToolDefinition | null;
  onClose: () => void;
  onConfirm: (toolId: string) => Promise<boolean>;
}

export const DeleteToolModal: React.FC<DeleteToolModalProps> = ({
  isOpen,
  tool,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !tool) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await onConfirm(tool.id);
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="delete-tool-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="delete-tool-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#0b0f19] border border-rose-500/50 rounded-lg shadow-[0_0_50px_rgba(244,63,94,0.2)] overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-rose-950/40 border-b border-rose-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xs bg-rose-950 border border-rose-500/50 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-sans font-bold text-white uppercase tracking-wider">
                Unregister Tool from Arsenal
              </h2>
              <span className="text-[10px] font-mono text-rose-300">
                Security Arsenal Management Action
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs font-mono text-slate-300 leading-relaxed">
            Are you sure you want to remove this tool definition from your active security arsenal?
          </p>

          {/* Tool Card preview */}
          <div className="p-3.5 rounded-xs bg-[#050811] border border-rose-950/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white">
                {tool.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-rose-950/60 text-rose-300 border border-rose-500/30">
                {tool.category}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <code className="text-cyan-300">${tool.binaryName}</code>
              <span>•</span>
              <span>{tool.version || 'v1.0.0'}</span>
            </div>

            <p className="text-[11px] font-mono text-slate-400 line-clamp-2">
              {tool.description}
            </p>
          </div>

          <div className="p-2.5 rounded-xs bg-rose-950/20 border border-rose-500/30 text-[11px] font-mono text-rose-300 flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
            <span>
              This will remove the tool and its {tool.safeLaunchTemplates.length} execution template(s) from your local and desktop workspace registry.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-[#070b14] border-t border-rose-950">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 rounded-xs border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xs bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Removing...' : 'Unregister Tool'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
