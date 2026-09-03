import React, { useEffect } from 'react';
import { 
  AlertOctagon, 
  RefreshCw, 
  FolderOpen, 
  BookOpen, 
  ShieldAlert
} from 'lucide-react';
import { BootReport } from '../../types/boot';
import { TechnicalDetailsDrawer } from './TechnicalDetailsDrawer';
import { useLaunchAudio } from '../../hooks/useLaunchAudio';

interface RecoveryModeProps {
  report: BootReport | null;
  onRetry: () => void;
  onSelectWorkspace: () => void;
  onOpenGuide: () => void;
  onBypassReadOnly?: () => void;
}

export const RecoveryMode: React.FC<RecoveryModeProps> = ({
  report,
  onRetry,
  onSelectWorkspace,
  onOpenGuide,
  onBypassReadOnly,
}) => {
  const { triggerEvent, stopAll } = useLaunchAudio();

  useEffect(() => {
    // Immediately stop ambient & animation audio; play at most one subdued warning tone
    stopAll(0.1);
    triggerEvent('recovery_mode_entered');
  }, [stopAll, triggerEvent]);

  const primaryError = report?.fatalErrors[0] || report?.recoverableErrors[0] || 'Citadel could not verify a writable workspace on the removable drive.';

  return (
    <div className="relative z-20 flex flex-col items-center justify-center max-w-3xl w-full px-4 text-center animate-in fade-in duration-300 select-none">
      {/* Top Banner Alert */}
      <div className="mb-4 p-3 bg-[#08111c]/90 border border-[#ff5468]/60 text-[#ff5468] flex items-center gap-3 w-full rounded-xs">
        <div className="p-2 bg-[#ff5468]/10 border border-[#ff5468]/40 shrink-0">
          <AlertOctagon className="w-5 h-5 text-[#ff5468] animate-pulse" />
        </div>
        <div className="text-left min-w-0">
          <h2 className="citadel-heading text-sm font-display font-semibold uppercase tracking-[0.12em] text-[#ff5468] truncate">
            PORTABLE WORKSPACE UNAVAILABLE // RECOVERY MODE
          </h2>
          <p className="font-body text-[11px] text-[#7890a5] mt-0.5">
            Automatic startup suspended to prevent data corruption or lock conflict on external storage.
          </p>
        </div>
      </div>

      {/* Main Error Explanation Card */}
      <div className="w-full bg-[#08111c]/90 border border-[#1F1F21] p-6 mb-4 text-left space-y-4 shadow-2xl rounded-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#ffbd59] shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h3 className="citadel-heading text-xs font-display font-semibold text-[#d8f5ff] uppercase tracking-[0.12em]">
              Diagnostics & Remediation
            </h3>
            <p className="font-body text-xs text-[#d8f5ff] leading-relaxed font-mono">
              {primaryError}
            </p>
            <p className="font-body text-[11px] text-[#7890a5]/90">
              Reconnect the Citadel USB flash drive or choose a new workspace directory to continue. No files will be modified or overwritten without your explicit consent.
            </p>
          </div>
        </div>

        {/* Technical Drawer */}
        <div className="pt-2">
          <TechnicalDetailsDrawer report={report} errorLog={report?.fatalErrors || []} />
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[#1F1F21] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onRetry}
              className="citadel-btn-text flex items-center gap-2 px-4 py-2 bg-[#39d9ff]/10 hover:bg-[#39d9ff]/20 border border-[#39d9ff] text-[#39d9ff] text-xs font-display uppercase font-semibold tracking-[0.14em] transition-all cursor-pointer rounded-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Checks
            </button>

            <button
              onClick={onSelectWorkspace}
              className="citadel-btn-text flex items-center gap-2 px-4 py-2 bg-[#161618] hover:bg-[#1f2937] border border-[#1F1F21] text-[#d8f5ff] text-xs font-display uppercase tracking-[0.14em] transition-all cursor-pointer rounded-xs"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#39d9ff]" />
              Select Workspace Location
            </button>

            <button
              onClick={onOpenGuide}
              className="citadel-btn-text flex items-center gap-2 px-3 py-2 bg-[#161618] hover:bg-[#1f2937] border border-[#1F1F21] text-[#7890a5] hover:text-[#d8f5ff] text-xs font-display uppercase tracking-[0.14em] transition-all cursor-pointer rounded-xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Recovery Guide
            </button>
          </div>

          {onBypassReadOnly && (
            <button
              onClick={onBypassReadOnly}
              className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-hud tracking-wider text-[#ffbd59] hover:underline cursor-pointer uppercase"
            >
              Enter in Read-Only Sandbox Mode →
            </button>
          )}
        </div>
      </div>

      {/* Security notice footer */}
      <div className="text-[10px] font-hud text-[#7890a5]/60 flex items-center justify-center gap-4">
        <span>CITADEL SECURE BOOT SUBSYSTEM</span>
        <span>•</span>
        <span>NO AUTOMATIC DISK REWRITES</span>
      </div>
    </div>
  );
};
