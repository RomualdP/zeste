import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateProjectAudio } from './generate-project-audio';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../../../scenario/application/ports/chapter-repository.port';
import type { TtsServicePort } from '../ports/tts-service.port';
import type { AudioStoragePort } from '../ports/audio-storage.port';
import { ProjectEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('GenerateProjectAudio', () => {
  let useCase: GenerateProjectAudio;
  let projectRepository: ProjectRepositoryPort;
  let chapterRepository: ChapterRepositoryPort;
  let ttsService: TtsServicePort;
  let audioStorage: AudioStoragePort;

  const chapters = [
    ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0).setScript([
      { speaker: 'host', text: 'Welcome', tone: 'enthusiastic' },
    ]),
    ChapterEntity.create('ch2', 'p1', 'Main', 'Details', 1).setScript([
      { speaker: 'expert', text: 'Let me explain', tone: 'calm' },
    ]),
  ];

  beforeEach(() => {
    const project = ProjectEntity.create('p1', 'user-1', 'Test')
      .configure(Tone.Debate, TargetDuration.Medium, 2)
      .startProcessing();

    projectRepository = {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    chapterRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(chapters),
      save: vi.fn(),
      saveAll: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    };
    ttsService = {
      synthesizeChapter: vi.fn().mockResolvedValue({
        audioBuffer: Buffer.from('fake-audio'),
        durationMs: 30000,
      }),
    };
    audioStorage = {
      upload: vi.fn().mockResolvedValue('audio/p1/ch.mp3'),
      getUrl: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new GenerateProjectAudio(projectRepository, chapterRepository, ttsService, audioStorage);
  });

  it('should generate audio for all chapters', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(ttsService.synthesizeChapter).toHaveBeenCalledTimes(2);
    expect(chapterRepository.save).toHaveBeenCalledTimes(2);
  });

  it('should mark project as ready after all chapters are done', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(projectRepository.save).toHaveBeenCalled();
    const savedProject = vi.mocked(projectRepository.save).mock.calls[0]![0];
    expect(savedProject.status).toBe('ready');
  });

  it('should reject when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when user does not own the project', async () => {
    await expect(
      useCase.execute({ userId: 'other-user', projectId: 'p1' }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when no chapters exist', async () => {
    vi.mocked(chapterRepository.findByProjectId).mockResolvedValue([]);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('No chapters found');
  });

  it('should mark project as error if a chapter fails', async () => {
    vi.mocked(ttsService.synthesizeChapter)
      .mockResolvedValueOnce({ audioBuffer: Buffer.from('ok'), durationMs: 30000 })
      .mockRejectedValueOnce(new Error('TTS failed'));

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('TTS failed');

    const saveCalls = vi.mocked(projectRepository.save).mock.calls;
    const lastSavedProject = saveCalls[saveCalls.length - 1]![0];
    expect(lastSavedProject.status).toBe('error');
  });
});
