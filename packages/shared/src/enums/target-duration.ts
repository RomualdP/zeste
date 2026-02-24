export const TargetDuration = {
  Short: 5,
  Medium: 15,
  Long: 30,
} as const;

export type TargetDuration = (typeof TargetDuration)[keyof typeof TargetDuration];
