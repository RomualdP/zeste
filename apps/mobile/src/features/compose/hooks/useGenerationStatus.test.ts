import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '../../../shared/services/api';
import { useGenerationStatus } from './useGenerationStatus';

jest.mock('../../../shared/services/api');
const mockedGet = api.apiGet as jest.Mock;
const mockedPost = api.apiPost as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useGenerationStatus', () => {
  it('fetches the status immediately on mount', async () => {
    mockedGet.mockResolvedValue({ phase: 'plan', progress: 0, error: null });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith('/api/projects/p-1/generation-status');
      expect(result.current.status.phase).toBe('plan');
    });
  });

  it('polls every 2 seconds while phase is not terminal', async () => {
    mockedGet
      .mockResolvedValueOnce({ phase: 'plan', progress: 0, error: null })
      .mockResolvedValueOnce({ phase: 'scenario', progress: 0.33, error: null });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => expect(result.current.status.phase).toBe('plan'));

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(result.current.status.phase).toBe('scenario'));
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('stops polling when phase becomes ready', async () => {
    mockedGet.mockResolvedValueOnce({ phase: 'ready', progress: 1, error: null });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => expect(result.current.status.phase).toBe('ready'));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('stops polling when phase becomes error', async () => {
    mockedGet.mockResolvedValueOnce({ phase: 'error', progress: 0, error: 'Mistral down' });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => expect(result.current.status.phase).toBe('error'));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(result.current.status.error).toBe('Mistral down');
  });

  it('retry() re-POSTs /generate-full and resumes polling', async () => {
    mockedGet
      .mockResolvedValueOnce({ phase: 'error', progress: 0, error: 'boom' })
      .mockResolvedValueOnce({ phase: 'plan', progress: 0, error: null });
    mockedPost.mockResolvedValueOnce({ jobId: 'job-2' });

    const { result } = renderHook(() => useGenerationStatus('p-1'));
    await waitFor(() => expect(result.current.status.phase).toBe('error'));

    await act(async () => {
      await result.current.retry();
    });

    expect(mockedPost).toHaveBeenCalledWith('/api/projects/p-1/generate-full');
    await waitFor(() => expect(result.current.status.phase).toBe('plan'));
  });
});
