export const AUDIO = {
  WORDS_PER_MINUTE: 120,
  SILENCE_BETWEEN_REPLIES_MS: 300,
  MP3_BITRATE: 128,
  TARGET_WORDS: {
    5: 600,
    15: 1800,
    30: 3600,
  },
  DEFAULT_CHAPTERS: {
    5: 1,
    15: 3,
    30: 5,
  },
  MAX_CHAPTERS_PER_DURATION: {
    5: 2,
    15: 4,
    30: 6,
  },
  MAX_CHAPTERS: 6,
  MIN_CHAPTERS: 1,
} as const;
