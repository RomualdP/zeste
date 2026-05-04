import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '../../../shared/services/api';
import { useComposeFlow } from './useComposeFlow';

jest.mock('../../../shared/services/api');

const mockedPost = api.apiPost as jest.Mock;
const mockedPatch = api.apiPatch as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useComposeFlow', () => {
  it('starts in the name phase with empty data', () => {
    const { result } = renderHook(() => useComposeFlow());

    expect(result.current.phase).toBe('name');
    expect(result.current.projectId).toBeNull();
    expect(result.current.sources).toEqual([]);
    expect(result.current.tone).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('creates the project on submitName and advances to sources', async () => {
    mockedPost.mockResolvedValueOnce({ id: 'p-1', name: "L'IA en 2026" });
    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName("L'IA en 2026");
    });

    expect(mockedPost).toHaveBeenCalledWith('/api/projects', { name: "L'IA en 2026" });
    expect(result.current.projectId).toBe('p-1');
    expect(result.current.name).toBe("L'IA en 2026");
    expect(result.current.phase).toBe('sources');
  });

  it('keeps the name phase and exposes the error when project creation fails', async () => {
    mockedPost.mockRejectedValueOnce(new Error('Quota exceeded'));
    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('boom');
    });

    expect(result.current.phase).toBe('name');
    expect(result.current.projectId).toBeNull();
    expect(result.current.error).toBe('Quota exceeded');
  });

  it('rejects empty names', async () => {
    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('   ');
    });

    expect(mockedPost).not.toHaveBeenCalled();
    expect(result.current.phase).toBe('name');
  });

  it('adds a URL source via API once a project exists', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://lemonde.fr/ia' });

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://lemonde.fr/ia' });
    });

    expect(mockedPost).toHaveBeenLastCalledWith('/api/projects/p-1/sources', {
      type: 'url',
      url: 'https://lemonde.fr/ia',
    });
    expect(result.current.sources).toHaveLength(1);
    expect(result.current.sources[0]).toMatchObject({ id: 's-1', type: 'url' });
  });

  it('advances from sources to tone when at least one source exists', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });

    act(() => {
      result.current.advanceToTone();
    });

    expect(result.current.phase).toBe('tone');
  });

  it('does not advance to tone when no source has been added', async () => {
    mockedPost.mockResolvedValueOnce({ id: 'p-1', name: 'X' });
    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });

    act(() => {
      result.current.advanceToTone();
    });

    expect(result.current.phase).toBe('sources');
  });

  it('selects a tone and auto-advances to duration', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });
    act(() => {
      result.current.advanceToTone();
    });
    act(() => {
      result.current.selectTone('debate');
    });

    expect(result.current.tone).toBe('debate');
    expect(result.current.phase).toBe('duration');
  });

  it('updates duration and chapters', () => {
    const { result } = renderHook(() => useComposeFlow());

    act(() => {
      result.current.setDuration(20);
      result.current.setChapters(4);
    });

    expect(result.current.duration).toBe(20);
    expect(result.current.chapters).toBe(4);
  });

  it('submits PATCH /configure then POST /generate-full and returns {projectId, tone}', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });
    mockedPatch.mockResolvedValueOnce({ id: 'p-1' });
    mockedPost.mockResolvedValueOnce({ jobId: 'job-1' });

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });
    act(() => {
      result.current.advanceToTone();
      result.current.selectTone('pedagogue');
      result.current.setDuration(12);
      result.current.setChapters(null);
    });

    let outcome: Awaited<ReturnType<typeof result.current.submit>> = null;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(mockedPatch).toHaveBeenCalledWith('/api/projects/p-1/configure', {
      tone: 'pedagogue',
      targetDuration: 12,
      chapterCount: 1,
    });
    expect(mockedPost).toHaveBeenLastCalledWith('/api/projects/p-1/generate-full');
    expect(outcome).toEqual({ projectId: 'p-1', tone: 'pedagogue' });

    await waitFor(() => expect(result.current.phase).toBe('ready'));
  });

  it('returns null and surfaces the error when /generate-full fails', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });
    mockedPatch.mockResolvedValueOnce({ id: 'p-1' });
    mockedPost.mockRejectedValueOnce(new Error('Quota exceeded'));

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });
    act(() => {
      result.current.advanceToTone();
      result.current.selectTone('debate');
    });

    let outcome: Awaited<ReturnType<typeof result.current.submit>> = null;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(outcome).toBeNull();
    expect(result.current.error).toBe('Quota exceeded');
    expect(result.current.phase).toBe('duration');
  });

  it('returns null and surfaces the error when submit fails', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });
    mockedPatch.mockRejectedValueOnce(new Error('Network down'));

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });
    act(() => {
      result.current.advanceToTone();
      result.current.selectTone('interview');
    });

    let outcome: Awaited<ReturnType<typeof result.current.submit>> = null;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(outcome).toBeNull();
    expect(result.current.error).toBe('Network down');
    expect(result.current.phase).toBe('duration');
  });
});
