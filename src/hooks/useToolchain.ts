import { useState, useEffect, useCallback } from 'react';
import { discoverToolchain } from '../lib/tauri';
import type { ToolchainSnapshot } from '../types';

export function useToolchain() {
  const [toolchain, setToolchain] = useState<ToolchainSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await discoverToolchain();
      setToolchain(data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to query host toolchain status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Refresh slow toolchain data periodically every 45s
    const timer = setInterval(() => {
      refresh();
    }, 45000);
    return () => clearInterval(timer);
  }, [refresh]);

  return {
    toolchain,
    loading,
    error,
    lastRefreshed,
    refresh,
  };
}
