import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

interface PulsingRingProps {
  delayMs: number;
  toneInk: string;
  size?: number;
  testID?: string;
}

const DURATION_MS = 2400;

export function PulsingRing({ delayMs, toneInk, size = 200, testID }: PulsingRingProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delayMs, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0] });

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: toneInk,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
