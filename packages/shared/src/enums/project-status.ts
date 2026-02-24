export const ProjectStatus = {
  Draft: 'draft',
  Processing: 'processing',
  Ready: 'ready',
  Error: 'error',
} as const;

export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
