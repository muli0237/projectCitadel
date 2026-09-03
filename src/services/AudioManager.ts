/**
 * Citadel Audio Manager
 * Custom procedural Web Audio engine for tactical, restrained sci-fi interface audio.
 * Zero external audio network requests; 100% locally synthesized & offline-capable.
 */

import { AudioMode, LaunchAudioEventType, AudioPlayOptions } from '../types/launchAudioEvents';
import { useAudioSettingsStore } from '../store/audioSettingsStore';

class CitadelAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private isAmbientRunning = false;
  private lastEventTimestamps = new Map<string, number>();
  private audioInitialized = false;

  constructor() {
    // Listen for blur event to pause background hum if app loses focus
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', () => {
        if (this.isAmbientRunning && this.ambientGain && this.ctx) {
          this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
      });

      window.addEventListener('focus', () => {
        if (this.isAmbientRunning && this.ambientGain && this.ctx) {
          const store = useAudioSettingsStore.getState();
          if (store.launchAudioEnabled && store.audioMode !== 'muted') {
            this.ambientGain.gain.setTargetAtTime(0.04 * store.masterVolume, this.ctx.currentTime, 0.2);
          }
        }
      });
    }
  }

  /**
   * Initializes the AudioContext upon user gesture (INITIALIZE CITADEL or user click)
   */
  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return null;

      try {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.updateMasterVolume();
      } catch (err) {
        console.warn('Web Audio API not supported in current environment:', err);
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.audioInitialized = true;
    return this.ctx;
  }

  /**
   * Update master gain from store volume
   */
  public updateMasterVolume() {
    const store = useAudioSettingsStore.getState();
    if (!this.ctx || !this.masterGain) return;

    const volume = store.audioMode === 'muted' || !store.launchAudioEnabled ? 0 : store.masterVolume;
    this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
  }

  /**
   * Check if sound should play according to user mode and motion settings
   */
  private shouldPlay(event: LaunchAudioEventType): boolean {
    const store = useAudioSettingsStore.getState();
    if (store.audioMode === 'muted' || !store.launchAudioEnabled || store.masterVolume <= 0) {
      return false;
    }

    // Reduced motion or reduced audio suppresses secondary sweeps and frequent ticks
    if (store.reducedAudioMode || store.audioMode === 'reduced') {
      if (event === 'scan_sweep' || event === 'boot_ring_assembled') {
        return false;
      }
    }

    return true;
  }

  /**
   * Rate-limiting helper to prevent stacking or noisy spam
   */
  private checkRateLimit(key: string, limitMs: number): boolean {
    const now = performance.now();
    const last = this.lastEventTimestamps.get(key) || 0;
    if (now - last < limitMs) {
      return false;
    }
    this.lastEventTimestamps.set(key, now);
    return true;
  }

  /**
   * Play specific Launch Sequence Audio Events
   */
  public triggerEvent(event: LaunchAudioEventType, options?: AudioPlayOptions) {
    if (!this.shouldPlay(event)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    switch (event) {
      case 'entry_gateway_ready':
        this.playEntryGatewayReady();
        break;
      case 'initialize_pressed':
        this.playInitializePressed();
        break;
      case 'background_ambient_start':
        this.startAmbientDrone();
        break;
      case 'boot_ring_assembled':
        this.playBootRingTick(options);
        break;
      case 'globe_activated':
        this.playGlobeActivationShimmer();
        break;
      case 'diagnostic_success':
        this.playDiagnosticSuccess();
        break;
      case 'diagnostic_warning':
        this.playDiagnosticWarning();
        break;
      case 'diagnostic_error':
        this.playDiagnosticError();
        break;
      case 'scan_sweep':
        this.playScanSweep();
        break;
      case 'synchronization_complete':
        this.playSynchronizationHarmonic();
        break;
      case 'citadel_online':
        this.playCitadelOnlineChime();
        break;
      case 'recovery_mode_entered':
        this.playRecoveryModeAlert();
        break;
    }
  }

  /**
   * 0-5s: Ignition Impact & Electrical Rise
   */
  public playIgnitionImpact() {
    if (!this.shouldPlay('initialize_pressed')) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;

      // 1. Deep Sub Bass Thud
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(90, t);
      subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.35);

      subGain.gain.setValueAtTime(0.3, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain);

      subOsc.start(t);
      subOsc.stop(t + 0.42);

      // 2. Subtle Electrical Rise
      const riseOsc = ctx.createOscillator();
      const riseGain = ctx.createGain();
      riseOsc.type = 'triangle';
      riseOsc.frequency.setValueAtTime(160, t + 0.08);
      riseOsc.frequency.exponentialRampToValueAtTime(540, t + 0.38);

      riseGain.gain.setValueAtTime(0.001, t);
      riseGain.gain.linearRampToValueAtTime(0.06, t + 0.18);
      riseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      riseOsc.connect(riseGain);
      riseGain.connect(this.masterGain);

      riseOsc.start(t + 0.08);
      riseOsc.stop(t + 0.48);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  /**
   * 5-12s: UI Proximity Tone (Button Hover)
   */
  public playButtonProximity() {
    const store = useAudioSettingsStore.getState();
    if (!store.interfaceAudioEnabled || store.audioMode === 'muted') return;
    if (!this.checkRateLimit('btn-hover', 120)) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(820, t + 0.04);

      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  /**
   * 12-15s: Button Activation Mechanical Click + Low-frequency Power Surge + Stereo Sweep
   */
  public playInitializePressed() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;

      // Click snap
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1200, t);
      clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

      clickGain.gain.setValueAtTime(0.08, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      clickOsc.connect(clickGain);
      clickGain.connect(this.masterGain);

      clickOsc.start(t);
      clickOsc.stop(t + 0.04);

      // Low-frequency power-up surge (12-15s)
      const surgeOsc = ctx.createOscillator();
      const surgeGain = ctx.createGain();
      surgeOsc.type = 'sawtooth';
      surgeOsc.frequency.setValueAtTime(60, t + 0.05);
      surgeOsc.frequency.exponentialRampToValueAtTime(240, t + 0.65);

      surgeGain.gain.setValueAtTime(0.001, t + 0.05);
      surgeGain.gain.linearRampToValueAtTime(0.12, t + 0.25);
      surgeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      // Lowpass filter to keep it calm and mechanical
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      surgeOsc.connect(filter);
      filter.connect(surgeGain);
      surgeGain.connect(this.masterGain);

      surgeOsc.start(t + 0.05);
      surgeOsc.stop(t + 0.75);

      // Stereo sweep (left to right)
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(-0.8, t + 0.1);
        panner.pan.linearRampToValueAtTime(0.8, t + 0.55);

        const sweepOsc = ctx.createOscillator();
        const sweepGain = ctx.createGain();
        sweepOsc.type = 'sine';
        sweepOsc.frequency.setValueAtTime(420, t + 0.1);
        sweepOsc.frequency.exponentialRampToValueAtTime(980, t + 0.55);

        sweepGain.gain.setValueAtTime(0.001, t + 0.1);
        sweepGain.gain.linearRampToValueAtTime(0.04, t + 0.3);
        sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        sweepOsc.connect(panner);
        panner.connect(sweepGain);
        sweepGain.connect(this.masterGain);

        sweepOsc.start(t + 0.1);
        sweepOsc.stop(t + 0.65);
      }
    } catch {}
  }

  /**
   * 15-21s: Short mechanical assembly ticks for boot rings
   */
  public playBootRingTick(options?: AudioPlayOptions) {
    if (!this.checkRateLimit('ring-tick', options?.rateLimitMs || 180)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const baseFreq = (options?.pitchShift || 1.0) * (340 + Math.random() * 80);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.035);

      const vol = (options?.volume || 0.04);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  /**
   * 21-28s: Holographic Globe Activation Shimmer
   */
  public playGlobeActivationShimmer() {
    if (!this.checkRateLimit('globe-shimmer', 3000)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      // High harmonic pure chime
      const frequencies = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.04);

        gain.gain.setValueAtTime(0.001, t + idx * 0.04);
        gain.gain.linearRampToValueAtTime(0.025, t + idx * 0.04 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.04 + 0.55);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + idx * 0.04);
        osc.stop(t + idx * 0.04 + 0.6);
      });
    } catch {}
  }

  /**
   * Continuous Quiet Looping Ambient System Hum (Low-volume drone)
   */
  public startAmbientDrone() {
    if (this.isAmbientRunning) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
      this.ambientGain.gain.linearRampToValueAtTime(0.035, ctx.currentTime + 2.0);
      this.ambientGain.connect(this.masterGain);

      // Low Drone Fundamental 55Hz (A1) + 110Hz (A2) with lowpass warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.connect(this.ambientGain);

      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110, ctx.currentTime);

      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(0.5, ctx.currentTime);
      osc1.connect(g1);
      g1.connect(filter);

      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.2, ctx.currentTime);
      osc2.connect(g2);
      g2.connect(filter);

      osc1.start();
      osc2.start();

      this.ambientOscillators = [
        { osc: osc1, gain: g1 },
        { osc: osc2, gain: g2 },
      ];
      this.isAmbientRunning = true;
    } catch {}
  }

  /**
   * Stops ambient drone cleanly
   */
  public stopAmbientDrone(fadeTimeSec: number = 0.5) {
    if (!this.isAmbientRunning) return;
    if (this.ambientGain && this.ctx) {
      try {
        this.ambientGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeTimeSec / 3);
        setTimeout(() => {
          this.ambientOscillators.forEach(({ osc }) => {
            try {
              osc.stop();
              osc.disconnect();
            } catch {}
          });
          this.ambientOscillators = [];
          this.isAmbientRunning = false;
        }, fadeTimeSec * 1000 + 50);
      } catch {
        this.isAmbientRunning = false;
      }
    } else {
      this.isAmbientRunning = false;
    }
  }

  /**
   * 28-36s: Orbit node data pulses
   */
  public playOrbitalNodePulse() {
    if (!this.checkRateLimit('orbit-pulse', 600)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(920, t);
      osc.frequency.exponentialRampToValueAtTime(1180, t + 0.03);

      gain.gain.setValueAtTime(0.015, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }

  /**
   * 36-44s: Diagnostic Check Success Confirmation Blip (Rate-Limited)
   */
  public playDiagnosticSuccess() {
    if (!this.checkRateLimit('diag-success', 280)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(740, t);
      osc.frequency.setValueAtTime(980, t + 0.03);

      gain.gain.setValueAtTime(0.03, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {}
  }

  /**
   * 36-44s: Diagnostic Warning Tone (Low-pitch amber tone)
   */
  public playDiagnosticWarning() {
    if (!this.checkRateLimit('diag-warn', 500)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.linearRampToValueAtTime(280, t + 0.12);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.16);
    } catch {}
  }

  /**
   * Diagnostic Error Tone (Restrained error tone for blocking issue)
   */
  public playDiagnosticError() {
    if (!this.checkRateLimit('diag-err', 1000)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(210, t);
      osc.frequency.linearRampToValueAtTime(170, t + 0.2);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, t);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }

  /**
   * 44-50s: Soft Scan Radar Sweep (Once every 6-8s)
   */
  public playScanSweep() {
    if (!this.checkRateLimit('scan-sweep', 5500)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.45);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.02, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.55);
    } catch {}
  }

  /**
   * 50-55s: Harmonic Synchronization Chord
   */
  public playSynchronizationHarmonic() {
    if (!this.checkRateLimit('sync-harmonic', 4000)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      // Frequencies for a calm open fifth / fourth chord: C4 (261.63), G4 (392.00), C5 (523.25)
      const chord = [261.63, 392.00, 523.25];
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.035, t + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t);
        osc.stop(t + 1.7);
      });
    } catch {}
  }

  /**
   * 55-60s: Original Two-Note Confirmation Tone (CITADEL ONLINE // CONTROL PLANE READY)
   */
  public playCitadelOnlineChime() {
    if (!this.checkRateLimit('citadel-online-chime', 4000)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      // Clean, iconic two-note resolution: C5 (523.25 Hz) -> G5 (783.99 Hz)
      const notes = [
        { freq: 523.25, start: 0.0, duration: 0.28, vol: 0.06 },
        { freq: 783.99, start: 0.22, duration: 0.65, vol: 0.08 },
      ];

      notes.forEach(({ freq, start, duration, vol }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + start);

        gain.gain.setValueAtTime(0.001, t + start);
        gain.gain.linearRampToValueAtTime(vol, t + start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + start + duration);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(t + start);
        osc.stop(t + start + duration + 0.05);
      });
    } catch {}
  }

  /**
   * Entry Gateway Ready Tone
   */
  public playEntryGatewayReady() {
    if (!this.checkRateLimit('entry-ready', 1500)) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.08);

      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {}
  }

  /**
   * Recovery Mode Alert
   */
  public playRecoveryModeAlert() {
    this.stopAllAudio(0.1);
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.setValueAtTime(180, t + 0.15);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.4);
    } catch {}
  }

  /**
   * Fade out and kill all launch audio
   */
  public stopAllAudio(fadeTimeSec: number = 0.25) {
    this.stopAmbientDrone(fadeTimeSec);
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, fadeTimeSec / 3);
        setTimeout(() => {
          this.updateMasterVolume();
        }, fadeTimeSec * 1000 + 60);
      } catch {}
    }
  }
}

export const audioManager = new CitadelAudioManager();
export const AudioManager = audioManager;
