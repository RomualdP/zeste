import { describe, it, expect } from 'vitest';
import {
  ProjectStatus,
  SourceType,
  SourceStatus,
  Tone,
  TargetDuration,
  ChapterStatus,
} from './index';

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
  it('should have convenience constants for common durations', () => {
    expect(TargetDuration.Short).toBe(5);
    expect(TargetDuration.Medium).toBe(15);
    expect(TargetDuration.Long).toBe(30);
  });

  it('should define min and max boundaries', () => {
    expect(TargetDuration.Min).toBe(5);
    expect(TargetDuration.Max).toBe(60);
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
