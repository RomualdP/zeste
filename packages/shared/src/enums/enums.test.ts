import { describe, it, expect } from 'vitest';
import {
  UserTier,
  ProjectStatus,
  SourceType,
  SourceStatus,
  Tone,
  TargetDuration,
  ChapterStatus,
} from './index';

describe('UserTier', () => {
  it('should have free and premium values', () => {
    expect(UserTier.Free).toBe('free');
    expect(UserTier.Premium).toBe('premium');
  });
});

describe('ProjectStatus', () => {
  it('should have all project lifecycle statuses', () => {
    expect(ProjectStatus.Draft).toBe('draft');
    expect(ProjectStatus.Processing).toBe('processing');
    expect(ProjectStatus.Ready).toBe('ready');
    expect(ProjectStatus.Error).toBe('error');
  });
});

describe('SourceType', () => {
  it('should have url and pdf types', () => {
    expect(SourceType.Url).toBe('url');
    expect(SourceType.Pdf).toBe('pdf');
  });
});

describe('SourceStatus', () => {
  it('should have pending, ingested, and error statuses', () => {
    expect(SourceStatus.Pending).toBe('pending');
    expect(SourceStatus.Ingested).toBe('ingested');
    expect(SourceStatus.Error).toBe('error');
  });
});

describe('Tone', () => {
  it('should have all 4 MVP tones', () => {
    expect(Tone.Pedagogue).toBe('pedagogue');
    expect(Tone.Debate).toBe('debate');
    expect(Tone.Vulgarization).toBe('vulgarization');
    expect(Tone.Interview).toBe('interview');
  });
});

describe('TargetDuration', () => {
  it('should have 5, 15, and 30 minute durations', () => {
    expect(TargetDuration.Short).toBe(5);
    expect(TargetDuration.Medium).toBe(15);
    expect(TargetDuration.Long).toBe(30);
  });
});

describe('ChapterStatus', () => {
  it('should have all chapter lifecycle statuses', () => {
    expect(ChapterStatus.Draft).toBe('draft');
    expect(ChapterStatus.Generating).toBe('generating');
    expect(ChapterStatus.Ready).toBe('ready');
    expect(ChapterStatus.Error).toBe('error');
  });
});
