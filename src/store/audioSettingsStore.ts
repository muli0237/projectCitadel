import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AudioMode, LaunchAudioSettings } from '../types/launchAudioEvents';

interface AudioSettingsState extends LaunchAudioSettings {
  setMasterVolume: (volume: number) => void;
  setLaunchAudioEnabled: (enabled: boolean) => void;
  setInterfaceAudioEnabled: (enabled: boolean) => void;
  setReducedAudioMode: (reduced: boolean) => void;
  setAudioMode: (mode: AudioMode) => void;
  toggleAudioMute: () => void;
}

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set, get) => ({
      masterVolume: 0.25, // Set initial launch volume to 25% as requested
      launchAudioEnabled: true,
      interfaceAudioEnabled: true,
      reducedAudioMode: false,
      audioMode: 'standard',

      setMasterVolume: (volume: number) => {
        const clamped = Math.max(0, Math.min(1, volume));
        set({
          masterVolume: clamped,
          audioMode: clamped === 0 ? 'muted' : get().audioMode === 'muted' ? 'standard' : get().audioMode,
        });
      },

      setLaunchAudioEnabled: (enabled: boolean) => {
        set({ launchAudioEnabled: enabled });
      },

      setInterfaceAudioEnabled: (enabled: boolean) => {
        set({ interfaceAudioEnabled: enabled });
      },

      setReducedAudioMode: (reduced: boolean) => {
        set({
          reducedAudioMode: reduced,
          audioMode: reduced ? 'reduced' : get().masterVolume === 0 ? 'muted' : 'standard',
        });
      },

      setAudioMode: (mode: AudioMode) => {
        if (mode === 'muted') {
          set({ audioMode: 'muted', launchAudioEnabled: false, interfaceAudioEnabled: false });
        } else if (mode === 'reduced') {
          set({ audioMode: 'reduced', reducedAudioMode: true, launchAudioEnabled: true, interfaceAudioEnabled: true });
        } else {
          set({ audioMode: 'standard', reducedAudioMode: false, launchAudioEnabled: true, interfaceAudioEnabled: true });
        }
      },

      toggleAudioMute: () => {
        const currentMode = get().audioMode;
        if (currentMode === 'muted') {
          set({
            audioMode: get().reducedAudioMode ? 'reduced' : 'standard',
            launchAudioEnabled: true,
            interfaceAudioEnabled: true,
          });
        } else {
          set({
            audioMode: 'muted',
            launchAudioEnabled: false,
            interfaceAudioEnabled: false,
          });
        }
      },
    }),
    {
      name: 'citadel-audio-settings',
    }
  )
);
