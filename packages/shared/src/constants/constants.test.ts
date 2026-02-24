import { describe, it, expect } from 'vitest';
import { QUOTAS, AUDIO } from './index';

describe('QUOTAS', () => {
  it('should define free tier limits per PRD', () => {
    expect(QUOTAS.FREE.maxProjects).toBe(3);
    expect(QUOTAS.FREE.maxSourcesPerProject).toBe(3);
    expect(QUOTAS.FREE.maxPdfPages).toBe(50);
    expect(QUOTAS.FREE.maxAudioDurationMinutes).toBe(15);
  });

  it('should define premium tier limits per PRD', () => {
    expect(QUOTAS.PREMIUM.maxProjects).toBe(20);
    expect(QUOTAS.PREMIUM.maxSourcesPerProject).toBe(10);
    expect(QUOTAS.PREMIUM.maxPdfPages).toBe(200);
    expect(QUOTAS.PREMIUM.maxAudioDurationMinutes).toBe(30);
  });

  it('should have premium limits strictly greater than free limits', () => {
    expect(QUOTAS.PREMIUM.maxProjects).toBeGreaterThan(QUOTAS.FREE.maxProjects);
    expect(QUOTAS.PREMIUM.maxSourcesPerProject).toBeGreaterThan(
      QUOTAS.FREE.maxSourcesPerProject,
    );
    expect(QUOTAS.PREMIUM.maxPdfPages).toBeGreaterThan(QUOTAS.FREE.maxPdfPages);
    expect(QUOTAS.PREMIUM.maxAudioDurationMinutes).toBeGreaterThan(
      QUOTAS.FREE.maxAudioDurationMinutes,
    );
  });
});

describe('AUDIO', () => {
  it('should define words per minute for spoken content', () => {
    expect(AUDIO.WORDS_PER_MINUTE).toBe(150);
  });

  it('should define target words matching PRD duration mapping', () => {
    expect(AUDIO.TARGET_WORDS[5]).toBe(750);
    expect(AUDIO.TARGET_WORDS[15]).toBe(2250);
    expect(AUDIO.TARGET_WORDS[30]).toBe(4500);
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
