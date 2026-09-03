import React, { useState, useEffect, useCallback } from 'react';
import { EntryGateway } from './EntryGateway';
import { BootSequence } from './BootSequence';
import { RecoveryMode } from './RecoveryMode';
import { LaunchAssetLayer } from './LaunchAssetLayer';
import { BootReport, LaunchState } from '../../types/boot';
import { useCitadelStore } from '../../store/useCitadelStore';
import { tauriBridge } from '../../services/tauriBridge';
import { sound } from '../../services/soundService';

interface LaunchExperienceProps {
  onComplete: () => void;
  totalDurationSeconds?: number;
}

export const LaunchExperience: React.FC<LaunchExperienceProps> = ({
  onComplete,
}) => {
  const { settings, updateSettings } = useCitadelStore();
  const [launchState, setLaunchState] = useState<LaunchState>('entry');
  const [bootReport, setBootReport] = useState<BootReport | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const reducedMotion = !settings.enableMotion;

  // 1. User activates INITIALIZE CITADEL (12-15s transition)
  const handleInitialize = useCallback(async () => {
    sound.playLaunchIgnition();
    setLaunchState('booting');

    // Begin real typed Rust boot checks
    try {
      const report = await tauriBridge.beginBootSequence();
      setBootReport(report);

      // If fatal errors detected in workspace / storage, transition to recovery mode
      if (!report.canEnterCommandCenter && report.fatalErrors.length > 0) {
        setTimeout(() => {
          setLaunchState('recovery');
        }, 1200);
      }
    } catch (err) {
      console.error('Boot sequence backend check error:', err);
    }
  }, []);

  // 2. Complete sequence at 60s
  const handleFinishSequence = useCallback(async () => {
    if (bootReport && !bootReport.canEnterCommandCenter && bootReport.fatalErrors.length > 0) {
      setLaunchState('recovery');
      return;
    }

    setLaunchState('ready');
    sound.playSuccess();

    // 250-400ms smooth dissolve into Command Center
    setTimeout(async () => {
      setLaunchState('transitioning');
      await tauriBridge.completeLaunchSequence();
      
      setTimeout(() => {
        onComplete();
      }, 300);
    }, 350);
  }, [bootReport, onComplete]);

  // 3. Skip sequence handler (ESC, Skip control, Click)
  const handleSkip = useCallback(async () => {
    sound.playClick();
    if (bootReport && !bootReport.canEnterCommandCenter && bootReport.fatalErrors.length > 0) {
      setLaunchState('recovery');
      return;
    }

    setLaunchState('transitioning');
    await tauriBridge.completeLaunchSequence();
    setTimeout(() => {
      onComplete();
    }, 250);
  }, [bootReport, onComplete]);

  // 4. Retry diagnostic checks in recovery mode
  const handleRetryChecks = async () => {
    sound.playClick();
    setLaunchState('booting');
    try {
      const report = await tauriBridge.retryBootChecks();
      setBootReport(report);
      if (report.canEnterCommandCenter) {
        handleFinishSequence();
      } else {
        setLaunchState('recovery');
      }
    } catch {
      setLaunchState('recovery');
    }
  };

  // 5. Select new workspace root
  const handleSelectWorkspaceRoot = async (newRoot: string) => {
    updateSettings({ workspaceRoot: newRoot });
    const report = await tauriBridge.selectWorkspaceRoot(newRoot);
    setBootReport(report);
  };

  // Keyboard shortcut listener: ESC to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Render State 1: Entry Gateway (0-12s)
  if (launchState === 'entry') {
    return (
      <EntryGateway
        onInitialize={handleInitialize}
        workspaceRoot={settings.workspaceRoot}
        onSelectWorkspaceRoot={handleSelectWorkspaceRoot}
        reducedMotion={reducedMotion}
        onSkip={handleSkip}
      />
    );
  }

  // Render State 2: Active Boot Sequence (12-60s)
  if (launchState === 'booting') {
    return (
      <BootSequence
        bootReport={bootReport}
        settings={settings}
        onSkip={handleSkip}
        onSequenceFinished={handleFinishSequence}
        reducedMotion={reducedMotion}
      />
    );
  }

  // Render State 3: Ready & Dissolve into Command Center
  if (launchState === 'ready' || launchState === 'transitioning') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#05070b] flex flex-col items-center justify-center select-none transition-opacity duration-300">
        <LaunchAssetLayer
          assetType="boot"
          opacity={launchState === 'transitioning' ? 0.15 : 0.45}
          overlayPreset="deep-space"
          reducedMotion={reducedMotion}
        />

        <div className={`relative z-10 flex flex-col items-center gap-4 text-center transition-all duration-300 ${
          launchState === 'transitioning' ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}>
          {/* Core Restrained Pulse Ring */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full border border-[#39d9ff] animate-ping opacity-35" />
            <div className="w-16 h-16 rounded-full bg-[#39d9ff]/15 border border-[#39d9ff] flex items-center justify-center shadow-[0_0_25px_#39d9ff]">
              <div className="w-3.5 h-3.5 rounded-full bg-[#d8f5ff] shadow-[0_0_10px_#ffffff]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="citadel-wordmark text-3xl md:text-5xl font-bold tracking-[0.18em] font-display text-[#d8f5ff] drop-shadow-[0_0_20px_rgba(57,217,255,0.8)]">
              CITADEL ONLINE
            </h1>
            <p className="citadel-heading text-xs font-display tracking-[0.12em] text-[#39d9ff] uppercase font-semibold">
              PORTABLE OPERATIONS WORKSPACE READY
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Recovery Mode
  if (launchState === 'recovery') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#05070b] flex items-center justify-center p-6">
        <LaunchAssetLayer
          assetType="boot"
          opacity={0.35}
          overlayPreset="dimmed-recovery"
          reducedMotion={reducedMotion}
        />

        <RecoveryMode
          report={bootReport}
          onRetry={handleRetryChecks}
          onSelectWorkspace={() => handleSelectWorkspaceRoot('/media/kali/CITADEL_DRIVE')}
          onOpenGuide={() => setShowGuideModal(true)}
          onBypassReadOnly={() => onComplete()}
        />

        {showGuideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070b]/90 p-4">
            <div className="w-full max-w-lg bg-[#08111c] border border-[#39d9ff]/40 p-6 rounded-xs space-y-4 shadow-2xl">
              <h3 className="citadel-heading font-display text-sm font-semibold text-[#d8f5ff] uppercase tracking-[0.12em]">
                Citadel Removable Storage Recovery Guide
              </h3>
              <p className="font-body text-xs text-[#7890a5] leading-relaxed">
                If the flash drive was abruptly disconnected or mounted in read-only mode, Linux creates a safe unmount trap to prevent filesystem journal desynchronization.
              </p>
              <ul className="list-disc list-inside font-terminal text-xs text-[#d8f5ff] space-y-1">
                <li>Check physical USB connection</li>
                <li>Verify write permissions (<code className="text-[#39d9ff]">chmod +w /media/kali/CITADEL_DRIVE</code>)</li>
                <li>Remove stale lock: <code className="text-[#39d9ff]">rm -f /media/kali/CITADEL_DRIVE/workspace.lock</code></li>
              </ul>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="citadel-btn-text px-4 py-1.5 bg-[#39d9ff]/20 hover:bg-[#39d9ff]/30 text-[#39d9ff] font-display text-xs uppercase tracking-[0.14em] font-semibold cursor-pointer rounded-xs"
                >
                  Dismiss Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};
