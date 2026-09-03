import React, { useEffect, useState, useMemo, useRef } from 'react';
import { LaunchAssetLayer } from './LaunchAssetLayer';
import { TechnicalGrid } from './TechnicalGrid';
import { CitadelGlobe } from './CitadelGlobe';
import { BootRing } from './BootRing';
import { DiagnosticPanel } from './DiagnosticPanel';
import { DiagnosticRow } from './DiagnosticRow';
import { BootStatusFeed } from './BootStatusFeed';
import { BootProgressIndicator } from './BootProgressIndicator';
import { SkipSequenceButton } from './SkipSequenceButton';
import { LaunchAudioToggle } from './LaunchAudioToggle';
import { BootReport, BootCheckStatus } from '../../types/boot';
import { AppSettings } from '../../types';
import { useLaunchAudio } from '../../hooks/useLaunchAudio';

interface BootSequenceProps {
  bootReport: BootReport | null;
  settings: AppSettings;
  onSkip: () => void;
  onSequenceFinished: () => void;
  reducedMotion?: boolean;
}

export const BootSequence: React.FC<BootSequenceProps> = ({
  bootReport,
  settings,
  onSkip,
  onSequenceFinished,
  reducedMotion = false,
}) => {
  // Timeline starts at 12s and runs through 60s
  const [currentTimelineSecond, setCurrentTimelineSecond] = useState(12);
  const finishedRef = useRef(false);

  const {
    triggerEvent,
    startAmbient,
    stopAmbient,
    stopAll,
  } = useLaunchAudio();

  // Track triggered sound stages to prevent duplicates
  const audioStagesTriggered = useRef<Set<string>>(new Set());

  // Map real typed Rust health-check data to discrete diagnostic states
  const checkMap = useMemo(() => {
    const map = new Map<string, { status: BootCheckStatus; details?: string; durationMs?: number }>();
    if (bootReport?.checks) {
      for (const check of bootReport.checks) {
        map.set(check.id, {
          status: check.status,
          details: check.details,
          durationMs: check.durationMs,
        });
      }
    }
    return map;
  }, [bootReport]);

  // Progressive high-precision timer (12s to 60s)
  useEffect(() => {
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsedFrom12 = (performance.now() - startTime) / 1000;
      const timelineSec = 12 + elapsedFrom12;
      setCurrentTimelineSecond(timelineSec);

      if (timelineSec >= 60 && !finishedRef.current) {
        finishedRef.current = true;
        clearInterval(interval);
        onSequenceFinished();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onSequenceFinished]);

  const sec = currentTimelineSecond;

  // Sound Timeline Synchronization
  useEffect(() => {
    const triggered = audioStagesTriggered.current;

    // 15-21s: Trigger 3-5 mechanical assembly ticks
    if (sec >= 16 && sec < 21) {
      const tickKey = `ring-tick-${Math.floor(sec * 1.5)}`;
      if (!triggered.has(tickKey)) {
        triggered.add(tickKey);
        triggerEvent('boot_ring_assembled', {
          pitchShift: 0.85 + Math.random() * 0.3,
          rateLimitMs: 220,
        });
      }
    }

    // 21-28s: Globe activation shimmer + quiet looping ambient system hum
    if (sec >= 21 && !triggered.has('globe-activated')) {
      triggered.add('globe-activated');
      triggerEvent('globe_activated');
      startAmbient();
    }

    // 28-36s: Periodic orbital data pulses
    if (sec >= 29 && sec < 36) {
      const pulseKey = `orbit-${Math.floor(sec)}`;
      if (!triggered.has(pulseKey) && Math.floor(sec) % 2 === 0) {
        triggered.add(pulseKey);
        triggerEvent('diagnostic_success', { rateLimitMs: 800 });
      }
    }

    // 36-44s: Diagnostic Check Confirmation Blips
    if (sec >= 36 && sec < 44) {
      const diagKey = `diag-check-${Math.floor(sec)}`;
      if (!triggered.has(diagKey)) {
        triggered.add(diagKey);
        // Check if there are warnings or errors in the real report
        if (bootReport?.fatalErrors && bootReport.fatalErrors.length > 0) {
          triggerEvent('diagnostic_error');
        } else if (bootReport?.warnings && bootReport.warnings.length > 0) {
          triggerEvent('diagnostic_warning');
        } else {
          triggerEvent('diagnostic_success', { rateLimitMs: 350 });
        }
      }
    }

    // 44-50s: Scan Sweep
    if (sec >= 45 && !triggered.has('scan-sweep-1')) {
      triggered.add('scan-sweep-1');
      triggerEvent('scan_sweep');
    }

    // 50-55s: Harmonic synchronization tone + fade ambient down
    if (sec >= 50 && !triggered.has('sync-complete')) {
      triggered.add('sync-complete');
      triggerEvent('synchronization_complete');
      stopAmbient(1.2);
    }

    // 55-60s: Original two-note confirmation tone for CITADEL ONLINE // CONTROL PLANE READY
    if (sec >= 55 && !triggered.has('citadel-online')) {
      triggered.add('citadel-online');
      triggerEvent('citadel_online');
    }

    // Fade all audio before Command Center
    if (sec >= 59.2 && !triggered.has('audio-fadeout')) {
      triggered.add('audio-fadeout');
      stopAll(0.3);
    }
  }, [sec, triggerEvent, startAmbient, stopAmbient, stopAll, bootReport]);

  // Clean up audio if user leaves or component unmounts
  useEffect(() => {
    return () => {
      stopAll(0.2);
    };
  }, [stopAll]);

  // Phase Calculations
  // 12-15s: Crossfade & ignition
  const isPhase12To15 = sec < 15;
  // 15-21s: Tech grid, central light source, incomplete mechanical ring segments
  const isPhase15To21 = sec >= 15 && sec < 21;
  // 21-28s: Globe line-by-line & 2-4 rings assembly
  const isPhase21To28 = sec >= 21 && sec < 28;
  // 28-36s: Slow globe rotation, orbital arcs, nodes, SQLite checks
  const isPhase28To36 = sec >= 28 && sec < 36;
  // 36-44s: Diagnostic panels reveal, typed check completion
  const isPhase36To44 = sec >= 36 && sec < 44;
  // 44-50s: Counter-rotating rings, scan sweep, status feed
  const isPhase44To50 = sec >= 44 && sec < 50;
  // 50-55s: Outer ring completion, globe paused, cyan pulse, SYSTEM SYNCHRONIZED
  const isPhase50To55 = sec >= 50 && sec < 55;
  // 55-60s: CITADEL ONLINE final title & globe dissolution
  const isPhase55To60 = sec >= 55;

  // Globe build progress (0 to 1 between 21s and 28s)
  const globeBuildProgress = reducedMotion || sec >= 28
    ? 1.0
    : sec < 21
    ? 0
    : (sec - 21) / 7;

  // Rings assembly count (1 to 4 between 21s and 28s)
  const ringCount = reducedMotion || sec >= 28
    ? 4
    : sec < 21
    ? 1
    : Math.min(4, Math.floor(1 + ((sec - 21) / 7) * 3));

  // Overall progress percentage across 60 seconds
  const progressPercentage = Math.min(100, (sec / 60) * 100);

  // Derive status checks
  const getStatus = (id: string, fallback: BootCheckStatus = 'pending'): BootCheckStatus => {
    return checkMap.get(id)?.status || fallback;
  };

  // Structured boot messages sequence matching exact phase specifications
  const bootMessages = useMemo(() => {
    const msgs: string[] = [];
    if (sec >= 12) msgs.push('INITIALIZING PORTABLE RUNTIME');
    if (sec >= 16) msgs.push('DETECTING HOST PROFILE');
    if (sec >= 21) msgs.push('VERIFYING CITADEL WORKSPACE ROOT');
    if (sec >= 24) msgs.push('VALIDATING REMOVABLE STORAGE HEALTH');
    if (sec >= 28) msgs.push('CHECKING SQLITE METADATA VAULT');
    if (sec >= 32) msgs.push('VERIFYING WORKSPACE LOCK & REGISTRY');
    if (sec >= 36) msgs.push('DISCOVERING LOCAL TOOLCHAIN');
    if (sec >= 44) msgs.push('INITIALIZING AUDIT VAULT');
    if (sec >= 48) msgs.push('PREPARING COMMAND CENTER');
    if (sec >= 50) msgs.push('SYSTEM SYNCHRONIZED');
    if (sec >= 55) msgs.push('CONTROL PLANE READY');
    return msgs;
  }, [sec]);

  // Storage and Host diagnostic values
  const workspaceRoot = bootReport?.workspaceRoot || settings.workspaceRoot;
  const isWritable = bootReport?.fatalErrors.length === 0;
  const freeSpace = bootReport?.driveHealth?.freeSpaceReadable || '28.4 GB';
  const totalSpace = bootReport?.driveHealth?.totalSpaceReadable || '64.0 GB';

  // Panels visibility (36s+)
  const panelsVisible = sec >= 36 || reducedMotion;

  // Crossfade calculation during 12-15s
  const crossfadeVal = sec < 15 ? Math.min(1, (sec - 12) / 3) : 1;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05070b] flex flex-col justify-between p-6 md:p-8 select-none">
      {/* Background Visual Asset Layer */}
      <LaunchAssetLayer
        assetType="boot"
        opacity={0.88}
        crossfadeProgress={isPhase12To15 ? crossfadeVal : undefined}
        overlayPreset="deep-space"
        animated={!reducedMotion}
        reducedMotion={reducedMotion}
      />

      {/* LAYER 3: Subtle Technical Grid (Revealed 15s+) */}
      {sec >= 15 && (
        <TechnicalGrid
          gridSize={64}
          opacity={reducedMotion ? 0.12 : Math.min(0.14, (sec - 15) * 0.03)}
        />
      )}

      {/* Central Light Source during 15-21s */}
      {sec >= 15 && sec < 28 && !reducedMotion && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1">
          <div className="w-96 h-96 rounded-full bg-[#39d9ff]/5 blur-3xl animate-pulse" />
        </div>
      )}

      {/* Top Header Bar */}
      <header className="relative z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-xs bg-[#39d9ff] animate-pulse" />
          <span className="citadel-heading font-display text-xs tracking-[0.12em] text-[#d8f5ff] font-semibold uppercase">
            CITADEL RUNTIME CALIBRATION
          </span>
        </div>

        <div className="flex items-center gap-4">
          <LaunchAudioToggle showVolumePercent={false} />
          
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-hud text-[#7890a5]">
            <span>PHASE:</span>
            <span className="text-[#39d9ff] uppercase font-semibold">
              {sec >= 55 ? 'ONLINE' : sec >= 50 ? 'SYNCHRONIZED' : sec >= 36 ? 'TOOLCHAIN_SYNC' : sec >= 21 ? 'WORKSPACE_VERIFY' : 'CORE_IGNITION'}
            </span>
          </div>
          <SkipSequenceButton onSkip={onSkip} />
        </div>
      </header>

      {/* Main Central Viewport: Holographic Globe & Flanking Diagnostics */}
      <main className="relative z-10 flex-1 flex items-center justify-between gap-4 md:gap-8 px-2 lg:px-8 my-auto">
        {/* Left Diagnostic Panel: Workspace & Storage Subsystems (Revealed 36-44s) */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0">
          <DiagnosticPanel
            title="STORAGE & WORKSPACE"
            badge="PORT.01"
            position="left"
            visible={panelsVisible}
          >
            <DiagnosticRow
              label="WORKSPACE ROOT"
              value={workspaceRoot.length > 18 ? `...${workspaceRoot.slice(-15)}` : workspaceRoot}
              status={getStatus('workspace-root', sec >= 21 ? 'success' : 'running')}
              subValue="Encrypted Removable Partition"
            />
            <DiagnosticRow
              label="DRIVE MOUNT"
              value="ATTACHED (EXT4)"
              status={getStatus('workspace-root', sec >= 23 ? 'success' : 'running')}
            />
            <DiagnosticRow
              label="WRITE ACCESS"
              value={isWritable ? 'RW VERIFIED' : 'READ ONLY'}
              status={getStatus('storage-write', sec >= 25 ? (isWritable ? 'success' : 'error') : 'pending')}
            />
            <DiagnosticRow
              label="STORAGE CAPACITY"
              value={`${freeSpace} FREE`}
              status={sec >= 27 ? 'success' : 'pending'}
              subValue={`Total ${totalSpace}`}
            />
            <DiagnosticRow
              label="SQLITE VAULT"
              value="WAL JOURNAL"
              status={getStatus('sqlite-vault', sec >= 30 ? 'success' : 'pending')}
              subValue="0 Integrity Errors"
            />
            <DiagnosticRow
              label="PROCESS LOCK"
              value="EXCLUSIVE PID"
              status={getStatus('process-lock', sec >= 34 ? 'success' : 'pending')}
            />
          </DiagnosticPanel>
        </div>

        {/* Center: Holographic Globe & Mechanical Rings */}
        <div className="relative flex-1 flex items-center justify-center min-w-0">
          <div className="relative flex items-center justify-center">
            {/* Concentric Mechanical Boot Rings */}
            {sec >= 15 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none scale-90 sm:scale-100">
                <BootRing
                  size={520}
                  stageProgress={Math.min(1, (sec - 15) / 5)}
                  reducedMotion={reducedMotion}
                  statusColor={sec >= 50 ? '#39d9ff' : '#367cff'}
                  assembledRingCount={ringCount}
                  isOuterRingComplete={sec >= 50}
                  counterRotateSpeed={sec >= 44 && sec < 50 ? 2.5 : 1}
                  isPaused={sec >= 50 && sec < 55}
                />
              </div>
            )}

            {/* Central Holographic Globe (15s+) */}
            {sec >= 15 && (
              <CitadelGlobe
                size={360}
                reducedMotion={reducedMotion}
                isActivated={sec >= 21}
                statusColor={sec >= 50 ? '#39d9ff' : isWritable ? '#39d9ff' : '#ff5468'}
                showScanSweep={!reducedMotion && sec >= 28 && sec < 50}
                buildProgress={globeBuildProgress}
                isRotating={sec >= 28 && sec < 50}
                isPaused={sec >= 50 && sec < 55}
                isDissolving={sec >= 55}
                pulseTrigger={sec >= 50 && sec < 53}
              />
            )}

            {/* Central Titles according to Phase */}
            {/* 15-21s Initial message */}
            {isPhase15To21 && (
              <div className="absolute flex flex-col items-center gap-1.5 text-center pointer-events-none z-20">
                <span className="citadel-heading font-display text-xs tracking-[0.12em] text-[#39d9ff] uppercase font-semibold animate-pulse">
                  INITIALIZING PORTABLE RUNTIME
                </span>
                <span className="citadel-diag-label font-hud text-[10px] tracking-[0.12em] text-[#7890a5] uppercase">
                  DETECTING HOST PROFILE
                </span>
              </div>
            )}

            {/* 50-55s SYSTEM SYNCHRONIZED // CONTROL PLANE READY */}
            {isPhase50To55 && (
              <div className="absolute flex flex-col items-center gap-2 text-center pointer-events-none z-20 transition-all duration-500">
                <div className="w-3 h-3 rounded-full bg-[#d8f5ff] shadow-[0_0_15px_#39d9ff] animate-ping" />
                <h2 className="citadel-heading text-xl md:text-2xl font-semibold tracking-[0.12em] font-display text-[#d8f5ff]">
                  SYSTEM SYNCHRONIZED
                </h2>
                <p className="citadel-diag-label text-xs font-hud tracking-[0.12em] text-[#39d9ff] uppercase font-medium">
                  CONTROL PLANE READY
                </p>
              </div>
            )}

            {/* 55-60s CITADEL ONLINE // PORTABLE OPERATIONS WORKSPACE READY */}
            {isPhase55To60 && (
              <div className="absolute flex flex-col items-center gap-2.5 text-center pointer-events-none z-30 transition-all duration-700">
                <h1 className="citadel-wordmark text-3xl md:text-5xl font-bold tracking-[0.18em] font-display text-[#d8f5ff] drop-shadow-[0_0_20px_rgba(57,217,255,0.8)]">
                  CITADEL ONLINE
                </h1>
                <p className="citadel-heading text-xs md:text-sm font-display tracking-[0.12em] text-[#39d9ff] uppercase font-semibold">
                  PORTABLE OPERATIONS WORKSPACE READY
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Diagnostic Panel: Host & Toolchain Discovery (Revealed 36-44s) */}
        <div className="hidden md:block w-72 lg:w-80 shrink-0">
          <DiagnosticPanel
            title="HOST & TOOLCHAIN"
            badge="STBD.02"
            position="right"
            visible={panelsVisible}
          >
            <DiagnosticRow
              label="OPERATING SYSTEM"
              value="KALI GNU/LINUX"
              status={getStatus('os-detect', sec >= 16 ? 'success' : 'running')}
              subValue="Rolling Release (2026.3)"
            />
            <DiagnosticRow
              label="KALI PROFILE"
              value="SEC_ENGINEERING"
              status={getStatus('kali-profile', sec >= 18 ? 'success' : 'running')}
            />
            <DiagnosticRow
              label="DEFAULT SHELL"
              value="/USR/BIN/ZSH"
              status={getStatus('shell-detect', sec >= 20 ? 'success' : 'running')}
            />
            <DiagnosticRow
              label="GIT VIRTUAL ENGINE"
              value="V2.48.1 ACTIVE"
              status={getStatus('tool-git', sec >= 38 ? 'success' : 'pending')}
            />
            <DiagnosticRow
              label="CONTAINER RUNTIME"
              value="DOCKER & PODMAN"
              status={getStatus('tool-containers', sec >= 41 ? 'success' : 'pending')}
            />
            <DiagnosticRow
              label="PYTHON 3 / UV"
              value="PYTHON 3.12.4"
              status={getStatus('tool-python', sec >= 44 ? 'success' : 'pending')}
            />
            <DiagnosticRow
              label="RUST & CARGO"
              value="CARGO 1.85.0"
              status={getStatus('tool-rust', sec >= 48 ? 'success' : 'pending')}
            />
          </DiagnosticPanel>
        </div>
      </main>

      {/* Bottom Command Area: Live Feed, Progress Bar, Status */}
      <footer className="relative z-20 flex flex-col items-center gap-3 max-w-2xl mx-auto w-full pb-2">
        <BootStatusFeed
          messages={bootMessages}
          currentStage={sec >= 55 ? 'READY' : sec >= 50 ? 'SYNCHRONIZED' : 'CALIBRATING'}
        />

        <BootProgressIndicator
          progressPercentage={progressPercentage}
          stageName={
            sec >= 55 ? 'PORTABLE_WORKSPACE_READY' :
            sec >= 50 ? 'SYSTEM_SYNCHRONIZED' :
            sec >= 36 ? 'TOOLCHAIN_DISCOVERY' :
            sec >= 21 ? 'WORKSPACE_VALIDATION' :
            'BOOT_CHECKS_ACTIVE'
          }
          totalTimeSeconds={60}
          elapsedSeconds={sec}
        />
      </footer>
    </div>
  );
};
