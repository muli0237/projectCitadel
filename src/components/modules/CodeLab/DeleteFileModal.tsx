import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { VirtualFile } from '../../../types';

interface DeleteFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  targetFile: VirtualFile | null;
  isDeleting: boolean;
}

export const DeleteFileModal: React.FC<DeleteFileModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetFile,
  isDeleting,
}) => {
  if (!isOpen || !targetFile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-md bg-[#0d1017] border border-rose-500/50 rounded-lg shadow-2xl shadow-rose-950/40 overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-rose-950/40 border-b border-rose-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-rose-900/80 border border-rose-500/50 text-rose-300">
              <Trash2 className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-tech font-bold uppercase tracking-wider text-rose-200">
              Confirm File Deletion
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-300">
            Are you sure you want to permanently delete this file from the Citadel workspace?
          </p>

          <div className="p-3 bg-[#080a0f] border border-gray-800 rounded font-mono text-xs space-y-1">
            <div className="flex items-center justify-between text-gray-400 text-[11px]">
              <span>Target File:</span>
              <span className="text-gray-300">{targetFile.language.toUpperCase()}</span>
            </div>
            <div className="text-cyan-300 font-semibold break-all">
              {targetFile.path}
            </div>
            <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-800/80 flex items-center justify-between">
              <span>Size: {targetFile.sizeBytes || new Blob([targetFile.content]).size} bytes</span>
              <span>Status: {targetFile.status?.toUpperCase() || 'CLEAN'}</span>
            </div>
          </div>

          {targetFile.isModified && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                <strong>Warning:</strong> This file has uncommitted or unsaved modifications. Deleting it will permanently erase these changes.
              </span>
            </div>
          )}

          <p className="text-[11px] text-gray-500 italic">
            This operation will invoke disk removal and close all active editor tabs associated with this path.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 bg-[#12161f] border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3 py-1.5 rounded bg-[#161b22] hover:bg-[#21262d] border border-gray-700 text-gray-300 text-xs font-tech transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-tech font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm shadow-rose-950/50"
          >
            {isDeleting ? (
              <span>Deleting File...</span>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
