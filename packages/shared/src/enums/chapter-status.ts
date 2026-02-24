export const ChapterStatus = {
  Draft: 'draft',
  Generating: 'generating',
  Ready: 'ready',
  Error: 'error',
} as const;

export type ChapterStatus = (typeof ChapterStatus)[keyof typeof ChapterStatus];
