import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JinaIngestionService } from './jina-ingestion-service';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('JinaIngestionService', () => {
  let service: JinaIngestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new JinaIngestionService('test-jina-key');
  });

  describe('ingestUrl', () => {
    it('should call Jina Reader API and return content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('# Article Title\n\nArticle content here.'),
      });

      const result = await service.ingestUrl('https://example.com/article');

      expect(result.content).toBe('# Article Title\n\nArticle content here.');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://r.jina.ai/https://example.com/article',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jina-key',
            Accept: 'text/markdown',
          }),
        }),
      );
    });

    it('should throw on Jina API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Unable to fetch URL'),
      });

      await expect(
        service.ingestUrl('https://example.com/broken'),
      ).rejects.toThrow('Jina Reader error');
    });

    it('should throw if content is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
      });

      await expect(
        service.ingestUrl('https://example.com/empty'),
      ).rejects.toThrow('No content extracted');
    });
  });

  describe('ingestPdf', () => {
    it('should throw not implemented for now', async () => {
      await expect(
        service.ingestPdf('/path/to/file.pdf'),
      ).rejects.toThrow('PDF ingestion not yet implemented');
    });
  });
});
