import { useState, useEffect, useCallback, useRef } from 'react';
import { getSystemSnapshot } from '../lib/tauri';
import type { SystemSnapshot } from '../types';

export type MetricState = 'loading' | 'available' | 'unavailable' | 'warning' | 'error';

export interface UseSystemMetricsOptions {
  activeModule?: string;
  isWindowFocused?: boolean;
}

export function useSystemMetrics({ activeModule = 'command-center', isWindowFocused = true }: UseSystemMetricsOptions = {}) {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [state, setState] = useState<MetricState>('loading');
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const fetchCountRef = useRef(0);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await getSystemSnapshot();
      setSnapshot(data);
      setState('available');
      setErrorReason(null);
      setLastUpdated(new Date());
      setIsStale(false);
      fetchCountRef.current += 1;
    } catch (err: any) {
      setState('error');
      setErrorReason(err?.message || 'Failed to communicate with local kernel metrics service');
      setIsStale(true);
    }
  }, []);

  // Adaptive refresh interval calculation
  useEffect(() => {
    fetchMetrics();

    // Determine interval based on window visibility and active module
    let intervalMs = 2000;
    if (!isWindowFocused || document.hidden) {
      intervalMs = 12000; // Background / hidden window
    } else if (activeModule === 'terminal-deck') {
      intervalMs = 5000; // Terminal-only view
    } else if (activeModule === 'command-center' || activeModule === 'system-monitor') {
      intervalMs = 2000; // High-density monitoring view
    } else {
      intervalMs = 4000; // Standard module view
    }

    const timer = setInterval(() => {
      fetchMetrics();
    }, intervalMs);

    // Stale check watcher
    const staleChecker = setInterval(() => {
      if (lastUpdated && Date.now() - lastUpdated.getTime() > intervalMs * 2.5) {
        setIsStale(true);
      }
    }, 1500);

    return () => {
      clearInterval(timer);
      clearInterval(staleChecker);
    };
  }, [fetchMetrics, isWindowFocused, activeModule, lastUpdated]);

  return {
    snapshot,
    state,
    errorReason,
    lastUpdated,
    isStale,
    refetch: fetchMetrics,
  };
}
