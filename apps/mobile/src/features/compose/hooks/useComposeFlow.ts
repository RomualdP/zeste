import { useCallback, useState } from 'react';
import { apiPatch, apiPost } from '../../../shared/services/api';
import type { ToneId } from '../../../shared/theme';

export type ComposePhase = 'name' | 'sources' | 'tone' | 'duration' | 'ready';

export type ComposeSourceType = 'url' | 'pdf' | 'text';

export interface ComposeSource {
  id: string;
  type: ComposeSourceType;
  value: string;
}

export interface UseComposeFlow {
  phase: ComposePhase;
  projectId: string | null;
  name: string;
  sources: ComposeSource[];
  tone: ToneId | null;
  duration: number;
  chapters: number | null;
  isLoading: boolean;
  error: string | null;
  submitName: (name: string) => Promise<void>;
  addSource: (input: { type: ComposeSourceType; value: string }) => Promise<void>;
  removeSource: (id: string) => void;
  advanceToTone: () => void;
  selectTone: (toneId: ToneId) => void;
  setDuration: (duration: number) => void;
  setChapters: (chapters: number | null) => void;
  submit: () => Promise<{ projectId: string } | null>;
}

const DEFAULT_DURATION = 15;

interface ProjectResponse {
  id: string;
  name: string;
}

interface SourceResponse {
  id: string;
  type: ComposeSourceType;
  value?: string;
  url?: string;
  text?: string;
}

function bodyForSource(input: { type: ComposeSourceType; value: string }) {
  if (input.type === 'url') return { type: 'url', url: input.value };
  if (input.type === 'text') return { type: 'text', text: input.value };
  return { type: 'pdf', url: input.value };
}

export function useComposeFlow(): UseComposeFlow {
  const [phase, setPhase] = useState<ComposePhase>('name');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [sources, setSources] = useState<ComposeSource[]>([]);
  const [tone, setTone] = useState<ToneId | null>(null);
  const [duration, setDurationState] = useState<number>(DEFAULT_DURATION);
  const [chapters, setChaptersState] = useState<number | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitName = useCallback(async (rawName: string) => {
    const trimmed = rawName.trim();
    if (trimmed.length === 0) return;

    setLoading(true);
    setError(null);
    try {
      const project = await apiPost<ProjectResponse>('/api/projects', { name: trimmed });
      setProjectId(project.id);
      setName(project.name);
      setPhase('sources');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const addSource = useCallback(
    async (input: { type: ComposeSourceType; value: string }) => {
      if (!projectId) return;

      setLoading(true);
      setError(null);
      try {
        const source = await apiPost<SourceResponse>(
          `/api/projects/${projectId}/sources`,
          bodyForSource(input),
        );
        setSources((prev) => [
          ...prev,
          { id: source.id, type: source.type ?? input.type, value: input.value },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const advanceToTone = useCallback(() => {
    if (sources.length > 0) {
      setPhase('tone');
    }
  }, [sources.length]);

  const selectTone = useCallback((toneId: ToneId) => {
    setTone(toneId);
    setPhase('duration');
  }, []);

  const setDuration = useCallback((value: number) => {
    setDurationState(value);
  }, []);

  const setChapters = useCallback((value: number | null) => {
    setChaptersState(value);
  }, []);

  const submit = useCallback(async (): Promise<{ projectId: string } | null> => {
    if (!projectId || !tone) return null;

    setLoading(true);
    setError(null);
    try {
      await apiPatch(`/api/projects/${projectId}/configure`, {
        tone,
        targetDuration: duration,
        chapterCount: chapters ?? 1,
      });
      setPhase('ready');
      return { projectId };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId, tone, duration, chapters]);

  return {
    phase,
    projectId,
    name,
    sources,
    tone,
    duration,
    chapters,
    isLoading,
    error,
    submitName,
    addSource,
    removeSource,
    advanceToTone,
    selectTone,
    setDuration,
    setChapters,
    submit,
  };
}
