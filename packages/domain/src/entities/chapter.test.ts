import { describe, it, expect } from 'vitest';
import { ChapterEntity } from './chapter';
import { ChapterStatus } from '@zeste/shared';

describe('ChapterEntity', () => {
  describe('create', () => {
    it('should create a chapter in draft status', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Introduction', 'Summary here', 0);
      expect(chapter.id).toBe('c1');
      expect(chapter.projectId).toBe('p1');
      expect(chapter.title).toBe('Introduction');
      expect(chapter.summary).toBe('Summary here');
      expect(chapter.position).toBe(0);
      expect(chapter.script).toEqual([]);
      expect(chapter.audioPath).toBeNull();
      expect(chapter.audioDuration).toBeNull();
      expect(chapter.status).toBe(ChapterStatus.Draft);
    });
  });

  describe('status transitions', () => {
    it('should transition draft → generating → ready', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Title', 'Summary', 0);
      const generating = chapter.startGenerating();
      expect(generating.status).toBe(ChapterStatus.Generating);

      const ready = generating.markReady('/audio/chapter1.mp3', 300);
      expect(ready.status).toBe(ChapterStatus.Ready);
      expect(ready.audioPath).toBe('/audio/chapter1.mp3');
      expect(ready.audioDuration).toBe(300);
    });

    it('should not allow generating from non-draft', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Title', 'Summary', 0).startGenerating();
      expect(() => chapter.startGenerating()).toThrow('Cannot start generating');
    });

    it('should not allow ready from non-generating', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Title', 'Summary', 0);
      expect(() => chapter.markReady('/path', 100)).toThrow('Cannot mark ready');
    });
  });

  describe('setScript', () => {
    it('should set the script entries', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Title', 'Summary', 0);
      const withScript = chapter.setScript([
        { speaker: 'host', text: 'Bienvenue !', tone: 'enthusiastic' },
        { speaker: 'expert', text: 'Merci.', tone: 'calm' },
      ]);
      expect(withScript.script).toHaveLength(2);
      expect(withScript.script[0]?.speaker).toBe('host');
    });
  });

  describe('reposition', () => {
    it('should update position', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Title', 'Summary', 0);
      const moved = chapter.reposition(3);
      expect(moved.position).toBe(3);
    });
  });

  describe('markError', () => {
    it('should transition to error from any status', () => {
      const chapter = ChapterEntity.create('c1', 'p1', 'Title', 'Summary', 0).startGenerating();
      const errored = chapter.markError();
      expect(errored.status).toBe(ChapterStatus.Error);
    });
  });
});
