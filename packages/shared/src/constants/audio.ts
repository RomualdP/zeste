export const AUDIO = {
  WORDS_PER_MINUTE: 120,
  SILENCE_BETWEEN_REPLIES_MS: 300,
  MP3_BITRATE: 128,
  MAX_CHAPTERS: 10,
  MIN_CHAPTERS: 1,
  MIN_DURATION: 5,
  MAX_DURATION: 60,
} as const;

/** Total target words for a given duration in minutes. */
export function targetWords(duration: number): number {
  return duration * AUDIO.WORDS_PER_MINUTE;
}

/** Suggested default chapter count for a given duration. */
export function defaultChapters(duration: number): number {
  const max = maxChaptersForDuration(duration);
  return Math.max(1, Math.min(Math.round(duration / 6), max));
}

/** Maximum allowed chapters for a given duration. */
export function maxChaptersForDuration(duration: number): number {
  return Math.max(1, Math.min(Math.floor(duration / 5), AUDIO.MAX_CHAPTERS));
}
