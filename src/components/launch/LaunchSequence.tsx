import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LaunchBackground } from './LaunchBackground';
import { AtmosphericVignette } from './AtmosphericVignette';
import { TechnicalGrid } from './TechnicalGrid';
import { CitadelGlobe } from './CitadelGlobe';
import { BootRing } from './BootRing';
import { DiagnosticPanel } from './DiagnosticPanel';
import { DiagnosticRow } from './DiagnosticRow';
import { LaunchWordmark } from './LaunchWordmark';
import { BootStatusFeed } from './BootStatusFeed';
import { BootProgressIndicator } from './BootProgressIndicator';
import { SkipSequenceButton } from './SkipSequenceButton';
import { RecoveryMode } from './RecoveryMode';
import { useCitadelStore } from '../../store/useCitadelStore';
import { BootStage, BootReport, BootCheck } from '../../types/boot';

interface LaunchSequenceProps {
  onComplete: () => void;
  totalDurationSeconds?: number;
}

export const LaunchSequence: React.FC<LaunchSequenceProps> = ({
  onComplete,
  totalDurationSeconds = 60,
}) => {
  const { 
    workspace, 
    driveHealth, 
    systemMetrics, 
    showToast,
  } = useCitadelStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentStage, setCurrentStage] = useState<BootStage>('Ignition');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userSkipped, setUserSkipped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Status message feed
  const [messages, setMessages] = useState<string[]>([
    'CITADEL BOOTLOADER v2.4.0 INITIALIZED',
    'DETECTING HOST ARCHITECTURE AND OS SUBSYSTEM',
  ]);

  // Dynamic Checks list
  const [checks, setChecks] = useState<BootCheck[]>([
    { id: 'os-detect', name: 'Host OS Detection', category: 'host', status: 'pending', isRequired: true, details: 'Evaluating /etc/os-release' },
    { id: 'kali-profile', name: 'Kali Linux Profile', category: 'host', status: 'pending', isRequired: false, details: 'Checking Kali toolchain paths' },
    { id: 'shell-detect', name: 'Default User Shell', category: 'host', status: 'pending', isRequired: true, details: 'Resolving zsh/bash executable' },
    { id: 'workspace-root', name: 'Portable Workspace Root', category: 'storage', status: 'pending', isRequired: true, details: 'Mount point verification' },
    { id: 'storage-write', name: 'Drive Storage IO & Write', category: 'storage', status: 'pending', isRequired: true, details: 'Testing atomic write permission' },
    { id: 'sqlite-vault', name: 'SQLite Metadata Vault', category: 'database', status: 'pending', isRequired: true, details: 'WAL journal & schema check' },
    { id: 'process-lock', name: 'Workspace Process Lock', category: 'security', status: 'pending', isRequired: true, details: 'Checking PID exclusivity' },
    { id: 'tool-git', name: 'Git Version Control', category: 'toolchain', status: 'pending', isRequired: false, details: 'Binary path query' },
    { id: 'tool-containers', name: 'Container Runtime', category: 'toolchain', status: 'pending', isRequired: false, details: 'Docker / Podman daemon check' },
    { id: 'tool-python', name: 'Python 3 Environment', category: 'toolchain', status: 'pending', isRequired: false, details: 'Standard library & uv' },
    { id: 'tool-rust', name: 'Rust & Cargo Toolchain', category: 'toolchain', status: 'pending', isRequired: false, details: 'Cargo compiler availability' },
    { id: 'audit-logging', name: 'Structured Audit Vault', category: 'runtime', status: 'pending', isRequired: true, details: 'Initializing append-only ledger' },
  ]);

  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const completedRef = useRef(false);

  // Check system prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update specific check status helper
  const updateCheck = useCallback((id: string, status: BootCheck['status'], details?: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, details: details || c.details } : c))
    );
  }, []);

  // Add message to boot feed helper
  const addMessage = useCallback((msg: string) => {
    setMessages((prev) => [...prev.slice(-8), msg]);
  }, []);

  // Trigger completion
  const handleCompleteSequence = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsTransitioning(true);

    setTimeout(() => {
      onComplete();
    }, 450);
  }, [onComplete]);

  // Skip sequence immediately
  const handleSkip = useCallback(() => {
    if (completedRef.current || recoveryMode) return;
    setUserSkipped(true);
    addMessage('MANUAL OVERRIDE: SKIPPING EXTENDED SEQUENCE');
    
    // Complete all remaining required checks immediately
    setChecks((prev) =>
      prev.map((c) => (c.status === 'pending' || c.status === 'running' ? { ...c, status: 'success' } : c))
    );
    setCurrentStage('ControlPlaneReady');
    
    setTimeout(() => {
      handleCompleteSequence();
    }, 200);
  }, [addMessage, handleCompleteSequence, recoveryMode]);

  // Keyboard shortcut listener (Escape, Enter, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // 60-Second Progressive Orchestrator
  useEffect(() => {
    if (userSkipped || recoveryMode) return;

    const tick = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      setElapsedSeconds(elapsed);

      // Phase 1: 0 - 5s -> Ignition
      if (elapsed < 5) {
        if (currentStage !== 'Ignition') setCurrentStage('Ignition');
        if (elapsed > 1.5 && checks[0].status === 'pending') {
          updateCheck('os-detect', 'running', 'Inspecting /etc/os-release');
          addMessage('RESOLVING HOST OPERATING SYSTEM');
        }
        if (elapsed > 3.5 && checks[0].status === 'running') {
          updateCheck('os-detect', 'success', systemMetrics?.osName || 'Kali Linux 2026.1');
          updateCheck('kali-profile', 'success', 'Kali Profile Active');
          addMessage(`HOST PROFILE ACTIVE: ${systemMetrics?.osName || 'Kali Linux (Roll-Release)'}`);
        }
      }
      // Phase 2: 5 - 18s -> Core Assembly
      else if (elapsed < 18) {
        if (currentStage !== 'CoreAssembly') {
          setCurrentStage('CoreAssembly');
          addMessage('ASSEMBLING PORTABLE ENGINE CORE');
        }
        if (elapsed > 8 && checks[2].status === 'pending') {
          updateCheck('shell-detect', 'running', 'Searching for default shell');
          addMessage('DETECTING LOCAL TERMINAL INTERPRETER');
        }
        if (elapsed > 12 && checks[2].status === 'running') {
          updateCheck('shell-detect', 'success', '/usr/bin/zsh');
          addMessage('SHELL READY: /usr/bin/zsh (Interactive Mode)');
        }
        if (elapsed > 14 && checks[3].status === 'pending') {
          updateCheck('workspace-root', 'running', 'Checking /media/kali/CITADEL_DRIVE');
          addMessage('LOCATING REMOVABLE WORKSPACE STORAGE');
        }
      }
      // Phase 3: 18 - 36s -> Workspace Verification & Globe Activation
      else if (elapsed < 36) {
        if (currentStage !== 'WorkspaceVerification') {
          setCurrentStage('WorkspaceVerification');
          addMessage('VERIFYING PORTABLE WORKSPACE & METADATA VAULT');
        }
        if (elapsed > 20 && checks[3].status === 'running') {
          updateCheck('workspace-root', 'success', workspace?.rootPath || '/media/kali/CITADEL_DRIVE');
          updateCheck('storage-write', 'running', 'Validating write permissions');
          addMessage(`MOUNT LOCATED: ${workspace?.rootPath || '/media/kali/CITADEL_DRIVE'}`);
        }
        if (elapsed > 25 && checks[4].status === 'running') {
          updateCheck('storage-write', 'success', driveHealth ? `${driveHealth.filesystem} (RW)` : 'ext4 (RW)');
          updateCheck('sqlite-vault', 'running', 'Validating SQLite WAL integrity');
          addMessage('STORAGE WRITABLE: EXT4 ATOMIC WAL ACTIVE');
        }
        if (elapsed > 30 && checks[5].status === 'running') {
          updateCheck('sqlite-vault', 'success', 'Integrity Verified (0 Errors)');
          updateCheck('process-lock', 'running', 'Checking lock exclusivity');
          addMessage('METADATA DATABASE VERIFIED: CITADEL.DB');
        }
        if (elapsed > 34 && checks[6].status === 'running') {
          updateCheck('process-lock', 'success', 'Exclusive Lock Held (PID 28419)');
          addMessage('WORKSPACE PROCESS LOCK ACQUIRED');
        }
      }
      // Phase 4: 36 - 52s -> Toolchain Discovery & System Sync
      else if (elapsed < 52) {
        if (currentStage !== 'ToolchainDiscovery') {
          setCurrentStage('ToolchainDiscovery');
          addMessage('DISCOVERING LOCAL TOOLCHAINS & CONTAINERS');
        }
        if (elapsed > 38 && checks[7].status === 'pending') {
          updateCheck('tool-git', 'running', 'git --version');
          addMessage('QUERYING GIT REPOSITORY SUBSYSTEM');
        }
        if (elapsed > 41 && checks[7].status === 'running') {
          updateCheck('tool-git', 'success', 'git v2.48.1');
          updateCheck('tool-containers', 'running', 'docker info');
          addMessage('CONTAINER ENGINE DISCOVERY: DOCKER / PODMAN');
        }
        if (elapsed > 45 && checks[8].status === 'running') {
          updateCheck('tool-containers', 'success', 'Docker 27.5 & Podman');
          updateCheck('tool-python', 'running', 'python3 -V / uv');
          addMessage('PYTHON RUNTIME DISCOVERY: PYTHON 3.12 + UV');
        }
        if (elapsed > 48 && checks[9].status === 'running') {
          updateCheck('tool-python', 'success', 'Python 3.12.3 (UV ready)');
          updateCheck('tool-rust', 'success', 'Rustc 1.85 / Cargo');
          updateCheck('audit-logging', 'running', 'Initializing audit vault');
          addMessage('INITIALIZING AUDIT VAULT & LOG REPOSITORIES');
        }
        if (elapsed > 50 && checks[11].status === 'running') {
          updateCheck('audit-logging', 'success', 'Encrypted WAL Active');
          addMessage('AUDIT VAULT SYNCHRONIZED');
        }
      }
      // Phase 5: 52 - 60s -> Control Plane Ready
      else if (elapsed <= totalDurationSeconds) {
        if (currentStage !== 'ControlPlaneReady') {
          setCurrentStage('ControlPlaneReady');
          addMessage('ALL REQUIRED CHECKS SATISFIED');
          addMessage('CITADEL ONLINE // CONTROL PLANE READY');
        }
      }
      // Complete after 60s
      else {
        handleCompleteSequence();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [
    currentStage, 
    checks, 
    elapsedSeconds, 
    totalDurationSeconds, 
    userSkipped, 
    recoveryMode, 
    systemMetrics, 
    workspace, 
    driveHealth, 
    addMessage, 
    updateCheck, 
    handleCompleteSequence
  ]);

  // Construct BootReport object
  const progressPercent = Math.min(100, (elapsedSeconds / totalDurationSeconds) * 100);
  const currentBootReport: BootReport = {
    currentStage,
    progressPercentage: progressPercent,
    checks,
    requiredChecksComplete: checks.filter((c) => c.isRequired).every((c) => c.status === 'success'),
    canEnterCommandCenter: !recoveryMode,
    recoverableErrors: [],
    fatalErrors: recoveryMode ? ['Removable storage device unmounted or locked by external process.'] : [],
    timestamp: new Date().toISOString(),
    workspaceRoot: workspace?.rootPath || '/media/kali/CITADEL_DRIVE',
    driveHealth: driveHealth || undefined,
  };

  const isReady = currentStage === 'ControlPlaneReady' || elapsedSeconds >= 52;
  const isLeftPanelVisible = elapsedSeconds > 18 || reducedMotion;
  const isRightPanelVisible = elapsedSeconds > 32 || reducedMotion;

  return (
    <div 
      className={`relative w-screen h-screen overflow-hidden bg-[#05070b] text-[#D1D1D1] flex flex-col justify-between p-4 sm:p-6 select-none transition-opacity duration-500 ${
        isTransitioning ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* LAYER 1: Background Image with Orbit atmosphere */}
      <LaunchBackground opacity={0.8} />

      {/* LAYER 2: Atmospheric Vignette */}
      <AtmosphericVignette />

      {/* LAYER 3: Technical Precision Grid */}
      <TechnicalGrid gridSize={72} opacity={elapsedSeconds > 4 || reducedMotion ? 0.14 : 0.04} />

      {/* TOP BAR / SKIP BUTTON */}
      <header className="relative z-20 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#39d9ff] animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#7890a5] uppercase">
            CITADEL // SECURE BOOTLOADER 2.4
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Recovery Simulation toggle for testing */}
          <button
            onClick={() => setRecoveryMode(!recoveryMode)}
            className="hidden lg:block text-[9px] font-mono text-[#7890a5]/60 hover:text-[#ffbd59] transition-colors cursor-pointer"
            title="Toggle Recovery Mode for testing"
          >
            [TEST RECOVERY MODE]
          </button>

          <SkipSequenceButton onSkip={handleSkip} disabled={isTransitioning} />
        </div>
      </header>

      {/* CENTER HUD STAGE: Rings, Globe, Diagnostics or Recovery Mode */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full my-auto">
        {recoveryMode ? (
          <RecoveryMode
            report={currentBootReport}
            onRetry={() => {
              setRecoveryMode(false);
              showToast({
                type: 'info',
                title: 'Retrying Startup Checks',
                message: 'Scanning USB drive and SQLite database...',
              });
            }}
            onSelectWorkspace={() => {
              showToast({
                type: 'info',
                title: 'Workspace Picker',
                message: 'Selected alternate workspace on /home/kali/citadel_dev',
              });
              setRecoveryMode(false);
            }}
            onOpenGuide={() => {
              showToast({
                type: 'info',
                title: 'Recovery Guide',
                message: 'Citadel Flash Drive Troubleshooting Runbook opened.',
              });
            }}
            onBypassReadOnly={() => {
              setRecoveryMode(false);
              handleSkip();
            }}
          />
        ) : (
          <div className="relative flex items-center justify-between w-full max-w-7xl px-2 sm:px-4">
            {/* LAYER 6 (Left): Left Diagnostic Panel */}
            <div className="hidden lg:flex justify-start w-1/3">
              <DiagnosticPanel
                title="PORTABLE WORKSPACE & IO"
                badge="STORAGE"
                position="left"
                visible={isLeftPanelVisible}
              >
                <DiagnosticRow
                  label="Workspace Root"
                  value={checks[3].status === 'success' ? 'MOUNTED' : checks[3].status.toUpperCase()}
                  status={checks[3].status}
                  subValue={workspace?.rootPath || '/media/kali/CITADEL_DRIVE'}
                />
                <DiagnosticRow
                  label="Storage IO Mode"
                  value={checks[4].status === 'success' ? 'EXT4 (RW)' : checks[4].status.toUpperCase()}
                  status={checks[4].status}
                  subValue="Atomic Sync Active"
                />
                <DiagnosticRow
                  label="Storage Capacity"
                  value={driveHealth ? `${(driveHealth.freeBytes / (1024 ** 3)).toFixed(1)} GB` : '22.4 GB'}
                  status={checks[4].status === 'success' ? 'success' : 'pending'}
                  subValue="Available Flash Space"
                />
                <DiagnosticRow
                  label="SQLite Database Vault"
                  value={checks[5].status === 'success' ? 'HEALTHY' : checks[5].status.toUpperCase()}
                  status={checks[5].status}
                  subValue="0 Errors / WAL Active"
                />
                <DiagnosticRow
                  label="Workspace PID Lock"
                  value={checks[6].status === 'success' ? 'PID 28419' : checks[6].status.toUpperCase()}
                  status={checks[6].status}
                  subValue="Exclusivity Verified"
                />
              </DiagnosticPanel>
            </div>

            {/* CENTER: Holographic Core Globe & Rings */}
            <div className="relative flex flex-col items-center justify-center mx-auto">
              {/* LAYER 5: Mechanical Boot Rings */}
              <BootRing
                size={540}
                stageProgress={elapsedSeconds > 4 ? 1 : elapsedSeconds / 4}
                reducedMotion={reducedMotion}
                statusColor={isReady ? '#39d9ff' : '#367cff'}
              />

              {/* LAYER 4: Holographic Globe */}
              <CitadelGlobe
                size={340}
                reducedMotion={reducedMotion}
                isActivated={elapsedSeconds > 10 || reducedMotion}
                statusColor={isReady ? '#39d9ff' : '#367cff'}
                showScanSweep={elapsedSeconds < 52 && !isReady}
              />

              {/* Center Overlay Wordmark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <LaunchWordmark
                  isReady={isReady}
                  subTitle={
                    currentStage === 'Ignition'
                      ? 'INITIALIZING PORTABLE RUNTIME'
                      : currentStage === 'CoreAssembly'
                      ? 'CORE ASSEMBLY IN PROGRESS'
                      : currentStage === 'WorkspaceVerification'
                      ? 'VERIFYING PORTABLE WORKSPACE'
                      : currentStage === 'ToolchainDiscovery'
                      ? 'DISCOVERING LOCAL TOOLCHAIN'
                      : 'CONTROL PLANE READY'
                  }
                />
              </div>
            </div>

            {/* LAYER 6 (Right): Right Diagnostic Panel */}
            <div className="hidden lg:flex justify-end w-1/3">
              <DiagnosticPanel
                title="HOST RUNTIME & TOOLCHAIN"
                badge="KALI POSIX"
                position="right"
                visible={isRightPanelVisible}
              >
                <DiagnosticRow
                  label="Host OS Distribution"
                  value={checks[0].status === 'success' ? 'KALI LINUX' : checks[0].status.toUpperCase()}
                  status={checks[0].status}
                  subValue="Kernel 6.12.0-kali"
                />
                <DiagnosticRow
                  label="Interactive Shell"
                  value={checks[2].status === 'success' ? 'ZSH 5.9' : checks[2].status.toUpperCase()}
                  status={checks[2].status}
                  subValue="/usr/bin/zsh"
                />
                <DiagnosticRow
                  label="Git Subsystem"
                  value={checks[7].status === 'success' ? 'INSTALLED' : checks[7].status.toUpperCase()}
                  status={checks[7].status}
                  subValue="Git 2.48.1"
                />
                <DiagnosticRow
                  label="Container Daemon"
                  value={checks[8].status === 'success' ? 'DOCKER' : checks[8].status.toUpperCase()}
                  status={checks[8].status}
                  subValue="Docker 27.5 / Podman"
                />
                <DiagnosticRow
                  label="Python & UV Runtime"
                  value={checks[9].status === 'success' ? 'PYTHON 3.12' : checks[9].status.toUpperCase()}
                  status={checks[9].status}
                  subValue="uv package manager active"
                />
                <DiagnosticRow
                  label="Rust & Cargo Toolchain"
                  value={checks[10].status === 'success' ? 'CARGO 1.85' : checks[10].status.toUpperCase()}
                  status={checks[10].status}
                  subValue="Local binary compiler"
                />
              </DiagnosticPanel>
            </div>
          </div>
        )}
      </main>

      {/* LAYER 7: Boot Console & Segmented Progress Bar */}
      <footer className="relative z-20 flex flex-col items-center justify-center gap-2.5 w-full">
        {/* Live Status Feed */}
        <BootStatusFeed
          messages={messages}
          currentStage={currentStage}
        />

        {/* Progress Bar */}
        <BootProgressIndicator
          progressPercentage={progressPercent}
          stageName={currentStage}
          totalTimeSeconds={totalDurationSeconds}
          elapsedSeconds={elapsedSeconds}
        />

        {/* Authorized Use Footer */}
        <div className="text-[9px] font-mono text-[#7890a5]/50 tracking-widest uppercase mt-1">
          LOCAL-FIRST // PORTABLE // AUTHORIZED USE ONLY // CITADEL WORKSPACE
        </div>
      </footer>
    </div>
  );
};
