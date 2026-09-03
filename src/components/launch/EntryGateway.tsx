import React, { useState, useEffect, useCallback } from 'react';
import { LaunchAssetLayer } from './LaunchAssetLayer';
import { InitializeCitadelButton } from './InitializeCitadelButton';
import { LaunchAudioToggle } from './LaunchAudioToggle';
import { Settings as SettingsIcon, HardDrive, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { useLaunchAudio } from '../../hooks/useLaunchAudio';

interface EntryGatewayProps {
  onInitialize: () => void;
  workspaceRoot: string;
  onSelectWorkspaceRoot?: (newRoot: string) => void;
  reducedMotion?: boolean;
  onSkip?: () => void;
}

export const EntryGateway: React.FC<EntryGatewayProps> = ({
  onInitialize,
  workspaceRoot,
  onSelectWorkspaceRoot,
  reducedMotion = false,
  onSkip,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [isEngaged, setIsEngaged] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customPath, setCustomPath] = useState(workspaceRoot);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const { playIgnition, playInitialize } = useLaunchAudio();

  // 0-12s internal timer for Entry Gateway phases
  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      setSeconds(elapsed);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCustomPath(workspaceRoot);
  }, [workspaceRoot]);

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen rejection if in restrictive sandbox
    }
  };

  const handleStart = useCallback(async () => {
    if (isEngaged) return;
    setIsEngaged(true);

    // Trigger controlled mechanical engagement click + power-up surge & stereo sweep
    playInitialize();

    // Auto-attempt fullscreen on user interaction
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    // 12-15s: Energy line shoots toward center for ~650ms, then handoff to boot sequence
    setTimeout(() => {
      onInitialize();
    }, 650);
  }, [isEngaged, onInitialize, playInitialize]);

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSelectWorkspaceRoot && customPath.trim()) {
      onSelectWorkspaceRoot(customPath.trim());
      setShowConfigModal(false);
    }
  };

  // Keyboard shortcut listener (ESC, Enter, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (onSkip) {
          e.preventDefault();
          onSkip();
        }
      } else if ((e.key === 'Enter' || e.key === ' ') && !isEngaged && seconds >= 0.5) {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart, isEngaged, onSkip, seconds]);

  // Phase 1 (0–2s): Brief subtle monogram pulse on startup
  const isInitialIgnition = seconds < 2 && !reducedMotion && !isEngaged;
  // Background image opacity: crisp and immediately visible
  const bgOpacity = isInitialIgnition ? Math.min(1.0, 0.85 + (seconds / 2) * 0.15) : 1.0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070b] flex flex-col justify-between p-6 md:p-12 select-none">
      {/* Background Asset Layer using high-resolution Citadel Entry Gateway */}
      <LaunchAssetLayer
        assetType="entry"
        opacity={bgOpacity}
        overlayPreset="cinematic-vignette"
        reducedMotion={reducedMotion}
      />

      {/* Subtle Startup Ignition Accent */}
      {isInitialIgnition && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-700">
          {/* Faint Cyan Horizontal Ignition Line */}
          <div className="relative w-full flex items-center justify-center">
            <div 
              className="h-[1px] bg-gradient-to-r from-transparent via-[#39d9ff] to-transparent transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(100, Math.max(15, seconds * 50))}%`,
                opacity: Math.min(0.7, (2 - seconds) * 0.5),
                boxShadow: '0 0 12px rgba(57,217,255,0.6)',
              }}
            />
          </div>
        </div>
      )}

      {/* PHASE 12-15s: Energy Line shooting from button toward screen center */}
      {isEngaged && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          {/* Vertical Cyan Laser Energy Beam from lower right to center */}
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="75%"
              y1="85%"
              x2="50%"
              y2="50%"
              stroke="#39d9ff"
              strokeWidth="2"
              strokeLinecap="round"
              className="animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 10px #39d9ff)',
              }}
            />
            <circle cx="50%" cy="50%" r="6" fill="#d8f5ff" className="animate-ping" />
          </svg>
        </div>
      )}

      {/* Top Header Row */}
      <header className="relative z-20 flex items-center justify-between transition-opacity duration-700 opacity-100">
        {/* Monogram Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-[#39d9ff] rounded-xs shadow-[0_0_8px_#39d9ff]" />
          <span className="citadel-diag-label font-hud text-xs tracking-[0.12em] text-[#7890a5] uppercase">
            SECURE PORTABLE ENVIRONMENT // KALI 2026
          </span>
        </div>

        {/* Top Controls: Audio Toggle, Fullscreen & Workspace Settings */}
        <div className="flex items-center gap-3">
          {/* Visible Launch Audio Toggle */}
          <LaunchAudioToggle />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-sm bg-[#08111c]/80 hover:bg-[#0c1a2c]/95 border border-[#39d9ff]/25 hover:border-[#39d9ff]/60 text-[#7890a5] hover:text-[#d8f5ff] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#39d9ff] focus-visible:outline-none"
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setShowConfigModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#08111c]/80 hover:bg-[#0c1a2c]/95 border border-[#39d9ff]/25 hover:border-[#39d9ff]/60 text-[#7890a5] hover:text-[#d8f5ff] font-hud text-xs tracking-wider transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#39d9ff] focus-visible:outline-none"
            aria-label="Configure workspace root path"
          >
            <HardDrive className="w-3.5 h-3.5 text-[#39d9ff]" />
            <span className="max-w-[180px] truncate font-terminal text-[11px]">{workspaceRoot}</span>
            <SettingsIcon className="w-3 h-3 text-[#7890a5]" />
          </button>
        </div>
      </header>

      {/* Center Zone */}
      <div className="relative z-10 flex-1 flex items-center justify-center pointer-events-none" />

      {/* Bottom Command Zone */}
      <footer className="relative z-20 flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 transition-all duration-700 opacity-100 translate-y-0">
        {/* Identity & Scope Information */}
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2 text-[#39d9ff] citadel-diag-label font-hud text-xs tracking-[0.12em]">
            <Shield className="w-3.5 h-3.5 text-[#39d9ff]" />
            <span>LOCAL-FIRST // PORTABLE // AUTHORIZED USE ONLY</span>
          </div>

          {/* Wordmark Hierarchy: Oxanium 700, uppercase, letter spacing 0.18em */}
          <h1 className="citadel-wordmark text-4xl md:text-6xl font-bold tracking-[0.18em] text-[#d8f5ff] font-display drop-shadow-[0_2px_16px_rgba(5,7,11,0.95)]">
            CITADEL
          </h1>

          {/* Launch Heading: Oxanium 600, uppercase, letter spacing 0.12em */}
          <p className="citadel-heading text-sm md:text-base font-semibold tracking-[0.12em] text-[#7890a5] font-display uppercase">
            PORTABLE OPERATIONS WORKSPACE
          </p>

          <p className="font-body text-xs text-[#7890a5]/90 mt-1">
            Host system linked. Standing by for local control plane ignition.
          </p>
        </div>

        {/* Primary Action Button: INITIALIZE CITADEL */}
        <div className="flex flex-col items-start md:items-end gap-2">
          <InitializeCitadelButton
            onInitialize={handleStart}
            autoFocus={true}
            isEngaged={isEngaged}
          />
          <div className="flex items-center gap-2 text-[10px] font-hud text-[#7890a5]/70 tracking-widest uppercase">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#08111c] border border-[#1F1F21] text-[#d8f5ff] font-terminal">ENTER</kbd>
            <span>or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#08111c] border border-[#1F1F21] text-[#d8f5ff] font-terminal">SPACE</kbd>
            <span>to initialize</span>
          </div>
        </div>
      </footer>

      {/* Optional Workspace Path Selection Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05070b]/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#08111c] border border-[#39d9ff]/30 rounded-sm p-6 shadow-[0_0_30px_rgba(5,7,11,0.8)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F21] mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#39d9ff]" />
                <h2 className="citadel-heading font-display text-sm font-semibold tracking-[0.12em] text-[#d8f5ff] uppercase">
                  Portable Workspace Root
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-[#7890a5] hover:text-[#d8f5ff] font-hud text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWorkspace} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block citadel-diag-label font-hud text-xs text-[#7890a5] uppercase tracking-[0.12em]">
                  Removable Drive Mount Path
                </label>
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/media/kali/CITADEL_DRIVE"
                  className="w-full px-3 py-2 bg-[#05070b] border border-[#1F1F21] focus:border-[#39d9ff] text-[#d8f5ff] font-terminal text-xs rounded-sm outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 text-[#7890a5] hover:text-[#d8f5ff] font-hud text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="citadel-btn-text px-4 py-1.5 bg-[#39d9ff]/20 hover:bg-[#39d9ff]/30 border border-[#39d9ff] text-[#39d9ff] font-display text-xs uppercase tracking-[0.14em] font-semibold rounded-sm cursor-pointer"
                >
                  Save Path
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
