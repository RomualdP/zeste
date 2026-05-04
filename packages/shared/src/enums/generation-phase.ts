export const GenerationPhase = {
  Idle: 'idle',
  Plan: 'plan',
  Scenario: 'scenario',
  Audio: 'audio',
  Ready: 'ready',
  Error: 'error',
} as const;

export type GenerationPhase = (typeof GenerationPhase)[keyof typeof GenerationPhase];
