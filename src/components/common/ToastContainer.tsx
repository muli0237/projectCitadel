import React from 'react';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useCitadelStore, ToastMessage } from '../../store/useCitadelStore';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCitadelStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastMessage['type']) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-[#0c1815]';
      case 'warning':
        return 'border-amber-500/40 bg-[#1a140a]';
      case 'error':
        return 'border-rose-500/40 bg-[#1a0c0e]';
      case 'info':
      default:
        return 'border-cyan-500/40 bg-[#0a1520]';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={clsx(
            'pointer-events-auto border rounded-lg p-3 shadow-xl backdrop-blur-md flex items-start justify-between gap-3 text-xs font-tech transition-all animate-in fade-in slide-in-from-bottom-3 duration-200',
            getBorderColor(toast.type)
          )}
        >
          <div className="flex items-start gap-2.5">
            {getIcon(toast.type)}
            <div>
              <div className="font-bold text-gray-100 uppercase tracking-tight">
                {toast.title}
              </div>
              {toast.message && (
                <div className="text-gray-300 text-[11px] font-sans mt-0.5 leading-relaxed">
                  {toast.message}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => dismissToast(toast.id)}
            className="text-gray-500 hover:text-gray-300 p-0.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
