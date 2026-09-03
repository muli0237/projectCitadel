import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Lock,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';

export type StatusVariant = 'emerald' | 'cyan' | 'amber' | 'rose' | 'slate' | 'violet';

export interface FloatingWorkspaceWindowProps {
  id: string;
  title: string;
  subtitle?: string;
  sectionStatus?: string;
  statusVariant?: StatusVariant;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  hasUnsavedChanges?: boolean;
  children: React.ReactNode;
  widthClass?: string;
  demoDataNotice?: boolean;
  footerActions?: React.ReactNode;
}

export const FloatingWorkspaceWindow: React.FC<FloatingWorkspaceWindowProps> = ({
  id,
  title,
  subtitle,
  sectionStatus = 'READY',
  statusVariant = 'cyan',
  icon: Icon,
  isOpen,
  onClose,
  triggerRef,
  hasUnsavedChanges = false,
  children,
  widthClass = 'max-w-4xl',
  demoDataNotice = false,
  footerActions,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Status pill style mapping
  const getStatusBadgeStyle = (variant?: StatusVariant | string) => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300';
      case 'amber':
        return 'bg-amber-950/60 border-amber-500/30 text-amber-300';
      case 'rose':
        return 'bg-rose-950/60 border-rose-500/30 text-rose-300';
      case 'violet':
        return 'bg-violet-950/60 border-violet-500/30 text-violet-300';
      case 'slate':
        return 'bg-slate-900/60 border-slate-700 text-slate-400';
      case 'cyan':
      default:
        return 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300';
    }
  };

  // Focus management and traps
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      setIsMinimized(false);

      // Focus first focusable element inside the modal or the modal itself
      const focusTimer = setTimeout(() => {
        if (windowRef.current) {
          const focusables = windowRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          } else {
            windowRef.current.focus();
          }
        }
      }, 50);

      return () => clearTimeout(focusTimer);
    } else {
      // Focus restoration
      if (triggerRef?.current) {
        triggerRef.current.focus();
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, triggerRef]);

  // Handle Tab key trapping
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && windowRef.current) {
        const focusables = windowRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose]
  );

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !hasUnsavedChanges) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Minimized Floating Pill state
  if (isMinimized) {
    return (
      <div className="fixed bottom-12 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans">
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#071126] border border-cyan-500/40 rounded-lg shadow-2xl text-slate-200">
          <div className="p-1.5 rounded-md bg-cyan-950/80 text-cyan-400">
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium">
            <span className="text-white">{title}</span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono uppercase">
              [{sectionStatus}]
            </span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label={`Restore ${title} panel`}
              title="Restore Window"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              aria-label={`Close ${title} panel`}
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs transition-opacity duration-200 font-sans select-none"
    >
      <div
        ref={windowRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className={clsx(
          'bg-[#071124] border border-slate-700/80 rounded-lg shadow-2xl flex flex-col justify-between overflow-hidden relative transition-all duration-200 focus:outline-hidden',
          isMaximized
            ? 'w-[96vw] max-w-[96vw] h-[92vh] max-h-[92vh]'
            : clsx('w-full max-h-[85vh] h-auto', widthClass)
        )}
      >
        {/* Window Title Bar */}
        <div className="h-12 bg-[#050b18] border-b border-slate-800/90 px-4 flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-md bg-[#0a162e] border border-cyan-500/30 text-cyan-400 shrink-0">
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <h2
                id={`${id}-title`}
                className="text-xs font-semibold text-white tracking-wide truncate"
              >
                {title}
              </h2>

              {sectionStatus && (
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider shrink-0',
                    getStatusBadgeStyle(statusVariant || 'cyan')
                  )}
                >
                  {sectionStatus}
                </span>
              )}

              {demoDataNotice && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  <Info className="w-2.5 h-2.5 text-cyan-400" />
                  DEMO DATA
                </span>
              )}
            </div>
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Minimize */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
              aria-label="Minimize panel to dock"
              title="Minimize"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            {/* Maximize / Restore */}
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded transition-colors cursor-pointer"
              aria-label={isMaximized ? 'Restore panel size' : 'Maximize panel within viewport'}
              title={isMaximized ? 'Restore size' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer ml-1"
              aria-label="Close panel"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtitle / Context Header if provided */}
        {subtitle && (
          <div className="px-5 py-2 bg-[#040915] border-b border-slate-800/60 text-xs text-slate-400 flex items-center justify-between shrink-0">
            <span>{subtitle}</span>
            <span className="text-[10px] font-mono text-slate-500">Air-Gap Enclave Protected</span>
          </div>
        )}

        {/* Window Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-200 select-text">
          {children}
        </div>

        {/* Optional Window Footer Actions */}
        {footerActions && (
          <div className="p-3.5 bg-[#050b18] border-t border-slate-800/90 flex items-center justify-between shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );
};
