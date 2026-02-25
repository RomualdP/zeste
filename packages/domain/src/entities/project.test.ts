import { describe, it, expect } from 'vitest';
import { ProjectEntity } from './project';
import { ProjectStatus, Tone, TargetDuration, defaultChapters } from '@zeste/shared';

describe('ProjectEntity', () => {
  describe('create', () => {
    it('should create a project with default values', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Mon podcast');
      expect(project.id).toBe('p1');
      expect(project.userId).toBe('u1');
      expect(project.name).toBe('Mon podcast');
      expect(project.status).toBe(ProjectStatus.Draft);
      expect(project.tone).toBe(Tone.Pedagogue);
      expect(project.targetDuration).toBe(TargetDuration.Medium);
      expect(project.chapterCount).toBe(defaultChapters(TargetDuration.Medium));
    });
  });

  describe('configure', () => {
    it('should update tone, duration, and chapter count', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test');
      const configured = project.configure(Tone.Debate, TargetDuration.Long, 5);
      expect(configured.tone).toBe(Tone.Debate);
      expect(configured.targetDuration).toBe(TargetDuration.Long);
      expect(configured.chapterCount).toBe(5);
    });

    it('should reject configuration when not in draft', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test').startProcessing();
      expect(() => project.configure(Tone.Interview, TargetDuration.Short, 1)).toThrow(
        'Cannot configure',
      );
    });

    it('should reject chapter count out of range', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test');
      expect(() => project.configure(Tone.Pedagogue, TargetDuration.Medium, 0)).toThrow(
        'Chapter count must be between',
      );
      expect(() => project.configure(Tone.Pedagogue, TargetDuration.Medium, 11)).toThrow(
        'Chapter count must be between',
      );
    });
  });

  describe('status transitions', () => {
    it('should transition draft → processing → ready', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test');
      expect(project.status).toBe(ProjectStatus.Draft);

      const processing = project.startProcessing();
      expect(processing.status).toBe(ProjectStatus.Processing);

      const ready = processing.markReady();
      expect(ready.status).toBe(ProjectStatus.Ready);
    });

    it('should transition processing → error', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test').startProcessing();
      const errored = project.markError();
      expect(errored.status).toBe(ProjectStatus.Error);
    });

    it('should not allow invalid transitions', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test');
      expect(() => project.markReady()).toThrow('Cannot mark ready');
      expect(() => project.markError()).toThrow('Cannot mark error');
    });

    it('should not allow processing from non-draft', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test').startProcessing().markReady();
      expect(() => project.startProcessing()).toThrow('Cannot start processing');
    });
  });

  describe('canBeConfigured / canStartProcessing', () => {
    it('should be true when draft', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test');
      expect(project.canBeConfigured).toBe(true);
      expect(project.canStartProcessing).toBe(true);
    });

    it('should be false when not draft', () => {
      const project = ProjectEntity.create('p1', 'u1', 'Test').startProcessing();
      expect(project.canBeConfigured).toBe(false);
      expect(project.canStartProcessing).toBe(false);
    });
  });
});
