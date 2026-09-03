/**
 * Citadel Launch Audio Event & State Definitions
 * Restrained sci-fi interface sound system
 */

export type AudioMode = 'muted' | 'reduced' | 'standard';

export type LaunchAudioEventType =
  | 'entry_gateway_ready'
  | 'initialize_pressed'
  | 'background_ambient_start'
  | 'boot_ring_assembled'
  | 'globe_activated'
  | 'diagnostic_success'
  | 'diagnostic_warning'
  | 'diagnostic_error'
  | 'scan_sweep'
  | 'synchronization_complete'
  | 'citadel_online'
  | 'recovery_mode_entered';

export interface LaunchAudioSettings {
  masterVolume: number; // 0.0 to 1.0 (default 0.25)
  launchAudioEnabled: boolean;
  interfaceAudioEnabled: boolean;
  reducedAudioMode: boolean;
  audioMode: AudioMode;
}

export interface AudioPlayOptions {
  volume?: number;
  rateLimitMs?: number;
  pitchShift?: number;
  stereoPan?: number;
  delayMs?: number;
}
