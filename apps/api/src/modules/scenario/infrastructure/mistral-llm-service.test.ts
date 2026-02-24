import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MistralLlmService } from './mistral-llm-service';
import { Tone } from '@zeste/shared';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('MistralLlmService', () => {
  let service: MistralLlmService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new MistralLlmService('test-api-key');
  });

  describe('generateChapterPlan', () => {
    it('should call Mistral API and return chapter plan', async () => {
      const plan = [
        { title: 'Introduction', summary: 'Présentation du sujet' },
        { title: 'Analyse', summary: 'Analyse approfondie' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(plan) } }],
        }),
      });

      const result = await service.generateChapterPlan({
        sources: ['Source content here'],
        tone: Tone.Pedagogue,
        chapterCount: 2,
      });

      expect(result).toEqual(plan);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        }),
      );
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limit exceeded'),
      });

      await expect(
        service.generateChapterPlan({
          sources: ['content'],
          tone: Tone.Debate,
          chapterCount: 3,
        }),
      ).rejects.toThrow('Mistral API error');
    });

    it('should include tone in the prompt', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[]' } }],
        }),
      });

      await service.generateChapterPlan({
        sources: ['content'],
        tone: Tone.Interview,
        chapterCount: 2,
      });

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      const systemPrompt = body.messages[0].content;
      expect(systemPrompt).toContain('interview');
    });
  });

  describe('generateChapterScript', () => {
    it('should call Mistral API and return script entries', async () => {
      const script = [
        { speaker: 'host', text: 'Bienvenue dans ce podcast', tone: 'welcoming' },
        { speaker: 'expert', text: 'Merci de m\'accueillir', tone: 'friendly' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(script) } }],
        }),
      });

      const result = await service.generateChapterScript({
        chapterTitle: 'Introduction',
        chapterSummary: 'Présentation du sujet',
        sources: ['Source content'],
        tone: Tone.Pedagogue,
        targetWordCount: 750,
        previousChaptersContext: [],
      });

      expect(result).toEqual(script);
      expect(result[0]!.speaker).toBe('host');
      expect(result[1]!.speaker).toBe('expert');
    });

    it('should throw on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal server error'),
      });

      await expect(
        service.generateChapterScript({
          chapterTitle: 'Test',
          chapterSummary: 'Test summary',
          sources: ['content'],
          tone: Tone.Vulgarization,
          targetWordCount: 750,
          previousChaptersContext: [],
        }),
      ).rejects.toThrow('Mistral API error');
    });

    it('should include previous chapters context', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '[]' } }],
        }),
      });

      await service.generateChapterScript({
        chapterTitle: 'Chapitre 2',
        chapterSummary: 'Suite du sujet',
        sources: ['content'],
        tone: Tone.Pedagogue,
        targetWordCount: 750,
        previousChaptersContext: ['Introduction : présentation du sujet'],
      });

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      const userPrompt = body.messages[1].content;
      expect(userPrompt).toContain('Introduction : présentation du sujet');
    });
  });
});
