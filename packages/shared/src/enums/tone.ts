export const Tone = {
  Pedagogue: 'pedagogue',
  Debate: 'debate',
  Vulgarization: 'vulgarization',
  Interview: 'interview',
} as const;

export type Tone = (typeof Tone)[keyof typeof Tone];
