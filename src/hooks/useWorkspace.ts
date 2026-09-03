import { useState, useEffect, useCallback } from 'react';
import { getWorkspaceStatus, listProjects, prepareSafeEject, createProject } from '../lib/tauri';
import type { WorkspaceStatus, ProjectRecord } from '../types';

export function useWorkspace() {
  const [status, setStatus] = useState<WorkspaceStatus | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ejectStatus, setEjectStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [wStatus, projList] = await Promise.all([
        getWorkspaceStatus(),
        listProjects(),
      ]);
      setStatus(wStatus);
      setProjects(projList);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to query workspace status');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSafeEject = useCallback(async () => {
    try {
      const msg = await prepareSafeEject();
      setEjectStatus(msg);
      await refresh();
      return msg;
    } catch (err: any) {
      setEjectStatus(`Eject failure: ${err?.message}`);
      throw err;
    }
  }, [refresh]);

  const handleCreateProject = useCallback(async (project: ProjectRecord) => {
    await createProject(project);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    status,
    projects,
    loading,
    error,
    ejectStatus,
    refresh,
    safeEject: handleSafeEject,
    addProject: handleCreateProject,
  };
}
