import { useEffect, useCallback } from 'react';
import { audioManager } from '../services/AudioManager';
import { useAudioSettingsStore } from '../store/audioSettingsStore';
import { LaunchAudioEventType, AudioPlayOptions } from '../types/launchAudioEvents';

export const useLaunchAudio = () => {
  const {
    masterVolume,
    launchAudioEnabled,
    interfaceAudioEnabled,
    reducedAudioMode,
    audioMode,
    setMasterVolume,
    setLaunchAudioEnabled,
    setInterfaceAudioEnabled,
    setReducedAudioMode,
    setAudioMode,
    toggleAudioMute,
  } = useAudioSettingsStore();

  useEffect(() => {
    audioManager.updateMasterVolume();
  }, [masterVolume, launchAudioEnabled, audioMode]);

  const triggerEvent = useCallback((event: LaunchAudioEventType, options?: AudioPlayOptions) => {
    audioManager.triggerEvent(event, options);
  }, []);

  const playHover = useCallback(() => {
    audioManager.playButtonProximity();
  }, []);

  const playIgnition = useCallback(() => {
    audioManager.playIgnitionImpact();
  }, []);

  const playInitialize = useCallback(() => {
    audioManager.playInitializePressed();
  }, []);

  const startAmbient = useCallback(() => {
    audioManager.startAmbientDrone();
  }, []);

  const stopAmbient = useCallback((fadeTimeSec?: number) => {
    audioManager.stopAmbientDrone(fadeTimeSec);
  }, []);

  const stopAll = useCallback((fadeTimeSec?: number) => {
    audioManager.stopAllAudio(fadeTimeSec);
  }, []);

  return {
    masterVolume,
    launchAudioEnabled,
    interfaceAudioEnabled,
    reducedAudioMode,
    audioMode,
    setMasterVolume,
    setLaunchAudioEnabled,
    setInterfaceAudioEnabled,
    setReducedAudioMode,
    setAudioMode,
    toggleAudioMute,
    triggerEvent,
    playHover,
    playIgnition,
    playInitialize,
    startAmbient,
    stopAmbient,
    stopAll,
  };
};
