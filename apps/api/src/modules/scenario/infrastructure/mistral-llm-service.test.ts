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
        targetWordCount: 8, // Low target so continuation is not triggered
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
          targetWordCount: 8,
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
        targetWordCount: 0,
        previousChaptersContext: ['Introduction : présentation du sujet'],
      });

      const body = JSON.parse(mockFetch.mock.calls[0]![1]!.body);
      const userPrompt = body.messages[1].content;
      expect(userPrompt).toContain('Introduction : présentation du sujet');
    });

    it('should make continuation call when script word count is below target', async () => {
      // First call: short script (~10 words, well below 750 target)
      const shortScript = [
        { speaker: 'host', text: 'Bonjour et bienvenue dans ce podcast', tone: 'welcoming' },
        { speaker: 'expert', text: 'Merci beaucoup pour cette invitation', tone: 'friendly' },
      ];
      // Continuation: more entries
      const continuationScript = Array.from({ length: 20 }, (_, i) => ({
        speaker: i % 2 === 0 ? 'host' : 'expert',
        text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit',
        tone: 'informative',
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: JSON.stringify(shortScript) } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: JSON.stringify(continuationScript) } }],
          }),
        });

      const result = await service.generateChapterScript({
        chapterTitle: 'Test',
        chapterSummary: 'Test summary',
        sources: ['content'],
        tone: Tone.Pedagogue,
        targetWordCount: 750,
        previousChaptersContext: [],
      });

      // Should have called fetch twice (initial + continuation)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // Merged result should contain both initial and continuation entries
      expect(result.length).toBe(shortScript.length + continuationScript.length);
    });

    it('should include existing script in continuation prompt', async () => {
      const shortScript = [
        { speaker: 'host', text: 'Bonjour et bienvenue', tone: 'welcoming' },
      ];
      const continuationScript = Array.from({ length: 20 }, (_, i) => ({
        speaker: i % 2 === 0 ? 'host' : 'expert',
        text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit',
        tone: 'informative',
      }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: JSON.stringify(shortScript) } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{ message: { content: JSON.stringify(continuationScript) } }],
          }),
        });

      await service.generateChapterScript({
        chapterTitle: 'Test',
        chapterSummary: 'Test summary',
        sources: ['content'],
        tone: Tone.Pedagogue,
        targetWordCount: 750,
        previousChaptersContext: [],
      });

      // Second call should contain the existing script in its prompt
      const continuationBody = JSON.parse(mockFetch.mock.calls[1]![1]!.body);
      const continuationUser = continuationBody.messages[1].content;
      expect(continuationUser).toContain('Bonjour et bienvenue');
    });

    it('should stop after max 3 continuation attempts', async () => {
      // Always return a very short script
      const tinyScript = [
        { speaker: 'host', text: 'Court.', tone: 'flat' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(tinyScript) } }],
        }),
      });

      await service.generateChapterScript({
        chapterTitle: 'Test',
        chapterSummary: 'Test summary',
        sources: ['content'],
        tone: Tone.Pedagogue,
        targetWordCount: 750,
        previousChaptersContext: [],
      });

      // 1 initial + 3 continuations max = 4 calls total
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should not continue when script meets 80% of target', async () => {
      // Generate a script that meets 80% of 100-word target = 80 words
      const adequateScript = [
        { speaker: 'host', text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation', tone: 'informative' },
        { speaker: 'expert', text: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation', tone: 'informative' },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: JSON.stringify(adequateScript) } }],
        }),
      });

      await service.generateChapterScript({
        chapterTitle: 'Test',
        chapterSummary: 'Test summary',
        sources: ['content'],
        tone: Tone.Pedagogue,
        targetWordCount: 40, // 80% of 40 = 32, script has ~40 words
        previousChaptersContext: [],
      });

      // Should have called fetch only once (no continuation needed)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
