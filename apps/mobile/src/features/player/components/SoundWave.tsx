import React, { useEffect, useRef, useState } from 'react';
import Svg, { Path } from 'react-native-svg';

interface SoundWaveProps {
  width: number;
  height: number;
  isPlaying: boolean;
}

const WAVE_CONFIGS = [
  { color: 'rgba(165, 160, 230, 0.3)', frequency: 1.2, ampScale: 0.9, speed: 1.3, strokeWidth: 2.5 },
  { color: 'rgba(34, 197, 94, 0.6)', frequency: 1.8, ampScale: 0.65, speed: 1.8, strokeWidth: 2 },
  { color: 'rgba(99, 102, 241, 0.7)', frequency: 1.5, ampScale: 0.8, speed: 1.5, strokeWidth: 2.5 },
];

function buildWavePath(
  width: number,
  height: number,
  config: (typeof WAVE_CONFIGS)[number],
  phase: number,
  amplitude: number,
): string {
  const mid = height / 2;
  const maxAmp = height * 0.35 * config.ampScale * amplitude;
  let d = `M 0 ${mid.toFixed(1)}`;

  for (let x = 4; x <= width; x += 4) {
    const nx = x / width;
    const envelope = Math.sin(nx * Math.PI);
    const y =
      mid +
      Math.sin(nx * config.frequency * Math.PI * 2 + phase * config.speed) *
        maxAmp *
        envelope;
    d += ` L ${x} ${y.toFixed(1)}`;
  }

  return d;
}

export function SoundWave({ width, height, isPlaying }: SoundWaveProps) {
  const phaseRef = useRef(0);
  const amplitudeRef = useRef(0.05);
  const rafRef = useRef<number>();
  const [, setTick] = useState(0);

  useEffect(() => {
    let lastTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Slow drift when paused, normal speed when playing
      phaseRef.current += dt * (isPlaying ? 1 : 0.1);

      // Lerp amplitude towards target
      const target = isPlaying ? 1 : 0.05;
      amplitudeRef.current += (target - amplitudeRef.current) * Math.min(1, dt * 4);

      setTick((t) => t + 1);

      // Keep animating while playing, or while amplitude is transitioning
      if (isPlaying || Math.abs(amplitudeRef.current - target) > 0.01) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  return (
    <Svg width={width} height={height} testID="sound-wave">
      {WAVE_CONFIGS.map((wave, i) => (
        <Path
          key={i}
          d={buildWavePath(width, height, wave, phaseRef.current, amplitudeRef.current)}
          stroke={wave.color}
          strokeWidth={wave.strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
