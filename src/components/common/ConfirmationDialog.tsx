import React from 'react';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { useCitadelStore } from '../../store/useCitadelStore';

export const ConfirmationDialog: React.FC = () => {
  const { confirmation, closeConfirmation } = useCitadelStore();

  if (!confirmation || !confirmation.isOpen) return null;

  const handleConfirm = () => {
    confirmation.onConfirm();
    closeConfirmation();
  };

  const handleCancel = () => {
    if (confirmation.onCancel) confirmation.onCancel();
    closeConfirmation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 font-sans">
      <div className="bg-[#071124] border border-slate-700/80 max-w-md w-full p-6 rounded-lg shadow-2xl relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`p-2.5 rounded-lg border shrink-0 ${
              confirmation.isDestructive
                ? 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-400'
            }`}
          >
            {confirmation.isDestructive ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              {confirmation.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {confirmation.message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleCancel}
            className="px-3.5 py-1.5 bg-[#081326] hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white rounded-md transition-colors cursor-pointer"
          >
            {confirmation.cancelLabel || 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              confirmation.isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {confirmation.confirmLabel || 'Proceed'}
          </button>
        </div>
      </div>
    </div>
  );
};
