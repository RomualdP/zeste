import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FishAudioTtsService } from './fish-audio-tts-service';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('FishAudioTtsService', () => {
  let service: FishAudioTtsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FishAudioTtsService('test-fish-key', 'host-voice-id', 'expert-voice-id');
  });

  describe('synthesizeChapter', () => {
    it('should call Fish Audio API for each segment and concatenate', async () => {
      const audioChunk1 = Buffer.from('audio-chunk-1');
      const audioChunk2 = Buffer.from('audio-chunk-2');

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(audioChunk1.buffer),
        })
        .mockResolvedValueOnce({
          ok: true,
          arrayBuffer: () => Promise.resolve(audioChunk2.buffer),
        });

      const result = await service.synthesizeChapter([
        { speaker: 'host', text: 'Bienvenue dans ce podcast' },
        { speaker: 'expert', text: 'Merci de m\'accueillir' },
      ]);

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.audioBuffer.length).toBeGreaterThan(0);
      expect(result.durationMs).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should use different voice IDs per speaker', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer),
      });

      await service.synthesizeChapter([
        { speaker: 'host', text: 'Hello' },
        { speaker: 'expert', text: 'Hi' },
      ]);

      const call1Body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      const call2Body = JSON.parse(mockFetch.mock.calls[1]![1]!.body);

      expect(call1Body.reference_id).toBe('host-voice-id');
      expect(call2Body.reference_id).toBe('expert-voice-id');
    });

    it('should prepend emotion tag when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer),
      });

      await service.synthesizeChapter([
        { speaker: 'host', text: 'Bienvenue dans ce podcast', emotion: 'excited' },
      ]);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      expect(body.text).toBe('(excited) Bienvenue dans ce podcast');
    });

    it('should not prepend emotion tag when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer),
      });

      await service.synthesizeChapter([
        { speaker: 'host', text: 'Bienvenue' },
      ]);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      expect(body.text).toBe('Bienvenue');
    });

    it('should send temperature and model header for expressiveness', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(Buffer.from('audio').buffer),
      });

      await service.synthesizeChapter([
        { speaker: 'host', text: 'Test' },
      ]);

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      const headers = mockFetch.mock.calls[0]![1]!.headers;

      expect(body.temperature).toBe(0.8);
      expect(headers.model).toBe('s1');
    });

    it('should throw on Fish Audio API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      await expect(
        service.synthesizeChapter([
          { speaker: 'host', text: 'Test' },
        ]),
      ).rejects.toThrow('Fish Audio API error');
    });

    it('should return empty buffer for empty segments', async () => {
      const result = await service.synthesizeChapter([]);
      expect(result.audioBuffer.length).toBe(0);
      expect(result.durationMs).toBe(0);
    });
  });
});
