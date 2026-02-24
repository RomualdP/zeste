export const SourceStatus = {
  Pending: 'pending',
  Ingested: 'ingested',
  Error: 'error',
} as const;

export type SourceStatus = (typeof SourceStatus)[keyof typeof SourceStatus];
