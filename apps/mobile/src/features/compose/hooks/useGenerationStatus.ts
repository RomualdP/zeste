import { useCallback, useEffect, useState } from 'react';
import { GenerationPhase } from '@zeste/shared';
import { apiGet, apiPost } from '../../../shared/services/api';
import { useInterval } from '../../../shared/hooks';

export interface GenerationStatusState {
  phase: GenerationPhase;
  progress: number;
  error: string | null;
}

export interface UseGenerationStatus {
  status: GenerationStatusState;
  retry: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;
const INITIAL: GenerationStatusState = {
  phase: GenerationPhase.Idle,
  progress: 0,
  error: null,
};

function isTerminal(phase: GenerationPhase): boolean {
  return phase === GenerationPhase.Ready || phase === GenerationPhase.Error;
}

export function useGenerationStatus(projectId: string): UseGenerationStatus {
  const [status, setStatus] = useState<GenerationStatusState>(INITIAL);

  const fetchStatus = useCallback(async () => {
    try {
      const next = await apiGet<GenerationStatusState>(
        `/api/projects/${projectId}/generation-status`,
      );
      setStatus(next);
    } catch (err) {
      setStatus({
        phase: GenerationPhase.Error,
        progress: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const delay = isTerminal(status.phase) ? null : POLL_INTERVAL_MS;
  useInterval(fetchStatus, delay);

  const retry = useCallback(async () => {
    await apiPost(`/api/projects/${projectId}/generate-full`);
    setStatus({ phase: GenerationPhase.Plan, progress: 0, error: null });
    await fetchStatus();
  }, [projectId, fetchStatus]);

  return { status, retry };
}
