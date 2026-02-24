export const SourceType = {
  Url: 'url',
  Pdf: 'pdf',
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];
