/**
 * Citadel Boot & Launch Sequence Types
 * Synchronized with Rust Serde models in src-tauri/src/models/boot.rs
 */

import type { DriveHealthReport, ToolchainSnapshot } from './index';

export type LaunchState =
  | 'entry'
  | 'initializing'
  | 'booting'
  | 'ready'
  | 'transitioning'
  | 'recovery';

export interface LaunchAssets {
  entryScreen: string;
  bootBackground: string;
}

export type BootStage =
  | 'ignition'
  | 'coreAssembly'
  | 'workspaceVerification'
  | 'toolchainDiscovery'
  | 'controlPlaneReady'
  | 'recoveryMode';

export type BootCheckStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'warning'
  | 'error'
  | 'unavailable'
  | 'skipped';

export type BootCheckCategory =
  | 'host'
  | 'storage'
  | 'database'
  | 'security'
  | 'toolchain'
  | 'runtime';

export interface BootCheck {
  id: string;
  name: string;
  category: BootCheckCategory;
  status: BootCheckStatus;
  details?: string;
  durationMs?: number;
  isRequired: boolean;
  timestamp?: string;
}

export interface BootReport {
  currentStage: BootStage;
  progressPercentage: number;
  checks: BootCheck[];
  requiredChecksComplete: boolean;
  canEnterCommandCenter: boolean;
  recoverableErrors: string[];
  fatalErrors: string[];
  timestamp: string;
  workspaceRoot: string;
  driveHealth?: DriveHealthReport;
  toolchain?: ToolchainSnapshot;
}

export interface LaunchSequenceState {
  launchState: LaunchState;
  bootReport: BootReport | null;
  sequenceStarted: boolean;
  userSkipped: boolean;
  reducedMotion: boolean;
  backendReady: boolean;
  isTransitioning: boolean;
  recoveryModeActive: boolean;
  selectedWorkspaceRoot: string;
  currentMessageIndex: number;
  recentMessages: string[];
}
