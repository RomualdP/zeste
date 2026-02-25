import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  trackColor?: string;
  activeTrackColor?: string;
  thumbColor?: string;
  onValueChange: (value: number) => void;
  testID?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  trackColor = '#ddd',
  activeTrackColor = '#FF6B35',
  thumbColor = '#FF6B35',
  onValueChange,
  testID,
}: SliderProps) {
  const trackWidth = useRef(0);
  const trackPageX = useRef(0);

  const snap = (v: number) => {
    const raw = Math.max(min, Math.min(max, v));
    return Math.round(raw / step) * step;
  };

  const fraction = (value - min) / (max - min);

  const valueFromPageX = useCallback(
    (pageX: number) => {
      if (trackWidth.current === 0) return value;
      const ratio = Math.max(0, Math.min(1, (pageX - trackPageX.current) / trackWidth.current));
      return snap(min + ratio * (max - min));
    },
    [min, max, step, value],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        onValueChange(valueFromPageX(evt.nativeEvent.pageX));
      },
      onPanResponderMove: (evt) => {
        onValueChange(valueFromPageX(evt.nativeEvent.pageX));
      },
    }),
  ).current;

  return (
    <View
      testID={testID}
      style={styles.container}
      onLayout={(e) => {
        e.target.measure((_x: number, _y: number, w: number, _h: number, pageX: number) => {
          trackWidth.current = w;
          trackPageX.current = pageX;
        });
      }}
      {...panResponder.panHandlers}
    >
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.trackFilled, { width: `${fraction * 100}%`, backgroundColor: activeTrackColor }]} />
      </View>
      <View style={[styles.thumb, { left: `${fraction * 100}%`, backgroundColor: thumbColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 40, justifyContent: 'center', marginVertical: 8 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  trackFilled: { height: 4, borderRadius: 2 },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
