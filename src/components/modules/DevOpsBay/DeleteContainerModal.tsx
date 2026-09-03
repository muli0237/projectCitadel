import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  Terminal,
  Container,
} from 'lucide-react';
import { ContainerSummary } from '../../../types';
import { bridge, isTauriEnvironment } from '../../../services/tauriBridge';
import { useCitadelStore } from '../../../store/useCitadelStore';

interface DeleteContainerModalProps {
  container: ContainerSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export const DeleteContainerModal: React.FC<DeleteContainerModalProps> = ({
  container,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { showToast } = useCitadelStore();
  const [removing, setRemoving] = useState(false);

  if (!isOpen || !container) return null;

  const isNative = isTauriEnvironment();
  const commandSyntax = `docker rm -f ${container.name}`;

  const handleConfirmDelete = async () => {
    setRemoving(true);
    try {
      await bridge.containerAction(container.id, 'remove');
      showToast({
        type: 'warning',
        title: 'Container Removed',
        message: `${container.name} (${container.id}) was permanently deleted from enclave.`,
      });
      onDeleted();
      setRemoving(false);
      onClose();
    } catch (err) {
      setRemoving(false);
    }
  };

  return (
    <div
      id="devops-delete-container-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        id="devops-delete-container-modal"
        className="bg-[#071126] border border-rose-500/40 rounded-md max-w-lg w-full flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-500/20 bg-[#030917]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xs bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-oxanium text-white uppercase tracking-wider">
                Purge Container // Destructive Removal
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-slate-400">
                  Unlink container from local overlayfs graph
                </span>
                <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-blue-950/80 text-blue-300 border border-blue-500/30">
                  {isNative ? 'TAURI IPC' : 'SANDBOX DAEMON'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={removing}
            className="p-1 rounded-xs hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-slate-200">
          <div className="flex items-start gap-3 p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs font-mono space-y-1">
              <p className="text-rose-200 font-bold">
                Permanent Workload Destruction
              </p>
              <p className="text-slate-300 text-[11px]">
                This will unbind all network endpoints, clear writable rootfs modifications, and destroy log streams for <strong className="text-white">{container.name}</strong>.
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="bg-[#030917] border border-cyan-950 rounded-xs p-3 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
              <span className="text-slate-400">Container ID:</span>
              <code className="text-cyan-300">{container.id}</code>
            </div>
            <div className="flex items-center justify-between border-b border-cyan-950 pb-2">
              <span className="text-slate-400">Image Source:</span>
              <span className="text-slate-200">{container.image}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Status Prior to Removal:</span>
              <span className="text-slate-300 font-bold uppercase">{container.status}</span>
            </div>
          </div>

          {/* Command Preview */}
          <div className="bg-[#020612] border border-cyan-500/30 rounded-xs p-2.5 font-mono text-xs">
            <span className="text-[10px] text-slate-400 block mb-1 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-cyan-400" />
              CLI Command Dispatched
            </span>
            <code className="text-rose-400 block truncate">$ {commandSyntax}</code>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-rose-500/20 bg-[#030917]/90">
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            className="px-3.5 py-1.5 rounded-xs text-xs font-mono text-slate-400 hover:text-white bg-transparent hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-container-btn"
            type="button"
            onClick={handleConfirmDelete}
            disabled={removing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xs text-xs font-mono font-bold uppercase transition-all shadow-xs bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_12px_rgba(225,29,72,0.3)]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{removing ? 'Removing...' : 'Delete Container'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
