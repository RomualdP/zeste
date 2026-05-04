import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { motion } from '../theme';

interface RiseStyle {
  opacity: Animated.Value;
  transform: Array<{ translateY: Animated.Value }>;
}

interface UseRiseResult {
  style: RiseStyle;
}

export function useRise(delay = 0): UseRiseResult {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.normal,
        delay,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.duration.normal,
        delay,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return {
    style: {
      opacity,
      transform: [{ translateY }],
    },
  };
}
