import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateChapterAudio } from './generate-chapter-audio';
import type { ChapterRepositoryPort } from '../../../scenario/application/ports/chapter-repository.port';
import type { TtsServicePort } from '../ports/tts-service.port';
import type { AudioStoragePort } from '../ports/audio-storage.port';
import { ChapterEntity } from '@zeste/domain';

describe('GenerateChapterAudio', () => {
  let useCase: GenerateChapterAudio;
  let chapterRepository: ChapterRepositoryPort;
  let ttsService: TtsServicePort;
  let audioStorage: AudioStoragePort;

  const chapter = ChapterEntity.create('ch1', 'p1', 'Introduction', 'Overview', 0).setScript([
    { speaker: 'host', text: 'Welcome to the show', tone: 'enthusiastic' },
    { speaker: 'expert', text: 'Thanks for having me', tone: 'friendly' },
  ]);

  beforeEach(() => {
    chapterRepository = {
      findById: vi.fn().mockResolvedValue(chapter),
      findByProjectId: vi.fn(),
      save: vi.fn(),
      saveAll: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    };
    ttsService = {
      synthesizeChapter: vi.fn().mockResolvedValue({
        audioBuffer: Buffer.from('fake-audio'),
        durationMs: 45000,
      }),
    };
    audioStorage = {
      upload: vi.fn().mockResolvedValue('audio/p1/ch1.mp3'),
      getUrl: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GenerateChapterAudio(chapterRepository, ttsService, audioStorage);
  });

  it('should generate audio for a chapter', async () => {
    const result = await useCase.execute({ chapterId: 'ch1' });

    expect(result.audioPath).toBe('audio/p1/ch1.mp3');
    expect(result.audioDuration).toBe(45000);
    expect(result.status).toBe('ready');
  });

  it('should pass script segments to TTS service', async () => {
    await useCase.execute({ chapterId: 'ch1' });

    expect(ttsService.synthesizeChapter).toHaveBeenCalledWith([
      { speaker: 'host', text: 'Welcome to the show' },
      { speaker: 'expert', text: 'Thanks for having me' },
    ]);
  });

  it('should upload audio to storage', async () => {
    await useCase.execute({ chapterId: 'ch1' });

    expect(audioStorage.upload).toHaveBeenCalledWith('p1', 'ch1', Buffer.from('fake-audio'));
  });

  it('should save chapter with audio info', async () => {
    await useCase.execute({ chapterId: 'ch1' });

    expect(chapterRepository.save).toHaveBeenCalled();
    const savedChapter = vi.mocked(chapterRepository.save).mock.calls[0]![0];
    expect(savedChapter.audioPath).toBe('audio/p1/ch1.mp3');
    expect(savedChapter.audioDuration).toBe(45000);
  });

  it('should reject when chapter not found', async () => {
    vi.mocked(chapterRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ chapterId: 'ch1' }),
    ).rejects.toThrow('Chapter not found');
  });

  it('should reject when chapter has no script', async () => {
    const emptyChapter = ChapterEntity.create('ch2', 'p1', 'Empty', 'No script', 0);
    vi.mocked(chapterRepository.findById).mockResolvedValue(emptyChapter);

    await expect(
      useCase.execute({ chapterId: 'ch2' }),
    ).rejects.toThrow('Chapter has no script');
  });

  it('should mark chapter as error on TTS failure', async () => {
    vi.mocked(ttsService.synthesizeChapter).mockRejectedValue(new Error('TTS unavailable'));

    await expect(
      useCase.execute({ chapterId: 'ch1' }),
    ).rejects.toThrow('TTS unavailable');

    expect(chapterRepository.save).toHaveBeenCalled();
    const savedChapter = vi.mocked(chapterRepository.save).mock.calls[0]![0];
    expect(savedChapter.status).toBe('error');
  });
});
