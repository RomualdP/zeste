import { describe, it, expect } from 'vitest';
import { SourceEntity } from './source';
import { SourceType, SourceStatus } from '@zeste/shared';

describe('SourceEntity', () => {
  describe('createUrl', () => {
    it('should create a URL source in pending status', () => {
      const source = SourceEntity.createUrl('s1', 'p1', 'https://example.com');
      expect(source.id).toBe('s1');
      expect(source.projectId).toBe('p1');
      expect(source.type).toBe(SourceType.Url);
      expect(source.url).toBe('https://example.com');
      expect(source.filePath).toBeNull();
      expect(source.status).toBe(SourceStatus.Pending);
      expect(source.rawContent).toBe('');
    });
  });

  describe('createPdf', () => {
    it('should create a PDF source in pending status', () => {
      const source = SourceEntity.createPdf('s1', 'p1', 'uploads/doc.pdf');
      expect(source.type).toBe(SourceType.Pdf);
      expect(source.filePath).toBe('uploads/doc.pdf');
      expect(source.url).toBeNull();
      expect(source.status).toBe(SourceStatus.Pending);
    });
  });

  describe('markIngested', () => {
    it('should transition to ingested with content', () => {
      const source = SourceEntity.createUrl('s1', 'p1', 'https://example.com');
      const ingested = source.markIngested('Some extracted content here');
      expect(ingested.status).toBe(SourceStatus.Ingested);
      expect(ingested.rawContent).toBe('Some extracted content here');
    });

    it('should reject ingestion from non-pending status', () => {
      const source = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested(
        'content',
      );
      expect(() => source.markIngested('more content')).toThrow('Cannot mark ingested');
    });
  });

  describe('markError', () => {
    it('should transition to error with message', () => {
      const source = SourceEntity.createUrl('s1', 'p1', 'https://example.com');
      const errored = source.markError('URL inaccessible');
      expect(errored.status).toBe(SourceStatus.Error);
      expect(errored.errorMessage).toBe('URL inaccessible');
    });
  });

  describe('wordCount', () => {
    it('should count words in raw content', () => {
      const source = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested(
        'Ceci est un contenu de test avec plusieurs mots',
      );
      expect(source.wordCount).toBe(9);
    });

    it('should return 0 for empty content', () => {
      const source = SourceEntity.createUrl('s1', 'p1', 'https://example.com');
      expect(source.wordCount).toBe(0);
    });
  });
});
