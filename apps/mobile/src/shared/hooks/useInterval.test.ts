import { renderHook } from '@testing-library/react-native';
import { useInterval } from './useInterval';

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls the callback at every tick', () => {
    const cb = jest.fn();
    renderHook(() => useInterval(cb, 1000));

    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('does not call the callback when delay is null', () => {
    const cb = jest.fn();
    renderHook(() => useInterval(cb, null));

    jest.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('clears the interval on unmount', () => {
    const cb = jest.fn();
    const { unmount } = renderHook(() => useInterval(cb, 1000));

    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);

    unmount();
    jest.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('uses the latest callback without resetting the interval', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const { rerender } = renderHook(({ fn }: { fn: () => void }) => useInterval(fn, 1000), {
      initialProps: { fn: cb1 },
    });

    jest.advanceTimersByTime(1000);
    expect(cb1).toHaveBeenCalledTimes(1);

    rerender({ fn: cb2 });
    jest.advanceTimersByTime(1000);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
