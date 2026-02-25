import { describe, it, expect } from 'vitest';
import { QUOTAS, AUDIO } from './index';

describe('QUOTAS', () => {
  it('should define subscriber limits', () => {
    expect(QUOTAS.maxProjects).toBe(20);
    expect(QUOTAS.maxSourcesPerProject).toBe(10);
    expect(QUOTAS.maxPdfPages).toBe(200);
    expect(QUOTAS.maxAudioDurationMinutes).toBe(30);
  });
});

describe('AUDIO', () => {
  it('should define words per minute for spoken content', () => {
    expect(AUDIO.WORDS_PER_MINUTE).toBe(120);
  });

  it('should define target words matching PRD duration mapping', () => {
    expect(AUDIO.TARGET_WORDS[5]).toBe(600);
    expect(AUDIO.TARGET_WORDS[15]).toBe(1800);
    expect(AUDIO.TARGET_WORDS[30]).toBe(3600);
  });

  it('should have consistent target words (duration * words_per_minute)', () => {
    expect(AUDIO.TARGET_WORDS[5]).toBe(5 * AUDIO.WORDS_PER_MINUTE);
    expect(AUDIO.TARGET_WORDS[15]).toBe(15 * AUDIO.WORDS_PER_MINUTE);
    expect(AUDIO.TARGET_WORDS[30]).toBe(30 * AUDIO.WORDS_PER_MINUTE);
  });

  it('should define default chapters per duration', () => {
    expect(AUDIO.DEFAULT_CHAPTERS[5]).toBe(1);
    expect(AUDIO.DEFAULT_CHAPTERS[15]).toBe(3);
    expect(AUDIO.DEFAULT_CHAPTERS[30]).toBe(5);
  });

  it('should constrain chapters between 1 and 6', () => {
    expect(AUDIO.MIN_CHAPTERS).toBe(1);
    expect(AUDIO.MAX_CHAPTERS).toBe(6);
  });
});
