import { renderHook } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { useRise } from './useRise';

describe('useRise', () => {
  it('returns animated opacity and translateY style values', () => {
    const { result } = renderHook(() => useRise());

    expect(result.current.style).toBeDefined();
    expect(result.current.style.opacity).toBeInstanceOf(Animated.Value);
    expect(result.current.style.transform).toHaveLength(1);
    expect(result.current.style.transform[0].translateY).toBeInstanceOf(Animated.Value);
  });

  it('starts hidden (opacity 0, translateY 12)', () => {
    const { result } = renderHook(() => useRise());

    const opacityValue = (result.current.style.opacity as unknown as { _value: number })._value;
    const translateYValue = (result.current.style.transform[0].translateY as unknown as {
      _value: number;
    })._value;

    expect(opacityValue).toBe(0);
    expect(translateYValue).toBe(12);
  });

  it('accepts a delay parameter without throwing', () => {
    expect(() => renderHook(() => useRise(200))).not.toThrow();
  });
});
