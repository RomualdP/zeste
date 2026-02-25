import { describe, it, expect } from 'vitest';
import { QUOTAS, AUDIO, targetWords, defaultChapters, maxChaptersForDuration } from './index';

describe('QUOTAS', () => {
  it('should define subscriber limits', () => {
    expect(QUOTAS.maxProjects).toBe(20);
    expect(QUOTAS.maxSourcesPerProject).toBe(10);
    expect(QUOTAS.maxPdfPages).toBe(200);
    expect(QUOTAS.maxAudioDurationMinutes).toBe(60);
  });
});

describe('AUDIO', () => {
  it('should define words per minute for spoken content', () => {
    expect(AUDIO.WORDS_PER_MINUTE).toBe(120);
  });

  it('should define duration boundaries', () => {
    expect(AUDIO.MIN_DURATION).toBe(5);
    expect(AUDIO.MAX_DURATION).toBe(60);
  });

  it('should constrain chapters between 1 and 10', () => {
    expect(AUDIO.MIN_CHAPTERS).toBe(1);
    expect(AUDIO.MAX_CHAPTERS).toBe(10);
  });
});

describe('targetWords', () => {
  it('should compute target words as duration * WORDS_PER_MINUTE', () => {
    expect(targetWords(5)).toBe(600);
    expect(targetWords(15)).toBe(1800);
    expect(targetWords(30)).toBe(3600);
    expect(targetWords(60)).toBe(7200);
    expect(targetWords(23)).toBe(23 * AUDIO.WORDS_PER_MINUTE);
  });
});

describe('defaultChapters', () => {
  it('should return sensible defaults for common durations', () => {
    expect(defaultChapters(5)).toBe(1);
    expect(defaultChapters(15)).toBeGreaterThanOrEqual(1);
    expect(defaultChapters(30)).toBeGreaterThanOrEqual(1);
    expect(defaultChapters(60)).toBeGreaterThanOrEqual(1);
  });

  it('should never exceed maxChaptersForDuration', () => {
    for (let d = 5; d <= 60; d++) {
      expect(defaultChapters(d)).toBeLessThanOrEqual(maxChaptersForDuration(d));
    }
  });

  it('should be at least 1', () => {
    for (let d = 5; d <= 60; d++) {
      expect(defaultChapters(d)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('maxChaptersForDuration', () => {
  it('should scale with duration', () => {
    expect(maxChaptersForDuration(5)).toBe(1);
    expect(maxChaptersForDuration(10)).toBe(2);
    expect(maxChaptersForDuration(15)).toBe(3);
    expect(maxChaptersForDuration(30)).toBe(6);
    expect(maxChaptersForDuration(50)).toBe(10);
    expect(maxChaptersForDuration(60)).toBe(10);
  });

  it('should be capped at MAX_CHAPTERS', () => {
    expect(maxChaptersForDuration(60)).toBe(AUDIO.MAX_CHAPTERS);
    expect(maxChaptersForDuration(100)).toBe(AUDIO.MAX_CHAPTERS);
  });

  it('should be at least 1', () => {
    expect(maxChaptersForDuration(1)).toBe(1);
    expect(maxChaptersForDuration(5)).toBeGreaterThanOrEqual(1);
  });
});
