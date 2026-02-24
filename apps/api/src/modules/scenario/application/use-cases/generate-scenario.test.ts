import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateScenario } from './generate-scenario';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../../project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { LlmServicePort } from '../ports/llm-service.port';
import { ProjectEntity, SourceEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration, AUDIO } from '@zeste/shared';

describe('GenerateScenario', () => {
  let useCase: GenerateScenario;
  let projectRepository: ProjectRepositoryPort;
  let sourceRepository: SourceRepositoryPort;
  let chapterRepository: ChapterRepositoryPort;
  let llmService: LlmServicePort;

  const ingestedSource = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested('Article content');

  const chapters = [
    ChapterEntity.create('ch1', 'p1', 'Introduction', 'Overview', 0),
    ChapterEntity.create('ch2', 'p1', 'Deep Dive', 'Analysis', 1),
    ChapterEntity.create('ch3', 'p1', 'Conclusion', 'Takeaways', 2),
  ];

  const mockScript = [
    { speaker: 'host' as const, text: 'Welcome to the show', tone: 'enthusiastic' },
    { speaker: 'expert' as const, text: 'Thanks for having me', tone: 'friendly' },
  ];

  beforeEach(() => {
    const project = ProjectEntity.create('p1', 'user-1', 'Test').configure(Tone.Debate, TargetDuration.Medium, 3);

    projectRepository = {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    sourceRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([ingestedSource]),
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
    llmService = {
      generateChapterPlan: vi.fn(),
      generateChapterScript: vi.fn().mockResolvedValue(mockScript),
    };

    useCase = new GenerateScenario(projectRepository, sourceRepository, chapterRepository, llmService);
  });

  it('should generate scripts for all chapters', async () => {
    const result = await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(result).toHaveLength(3);
    expect(result[0]!.script).toEqual(mockScript);
    expect(result[1]!.script).toEqual(mockScript);
    expect(result[2]!.script).toEqual(mockScript);
    expect(chapterRepository.save).toHaveBeenCalledTimes(3);
  });

  it('should set project status to processing', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(projectRepository.save).toHaveBeenCalled();
    const savedProject = vi.mocked(projectRepository.save).mock.calls[0]![0];
    expect(savedProject.status).toBe('processing');
  });

  it('should pass correct word count target per chapter', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    const totalWords = AUDIO.TARGET_WORDS[TargetDuration.Medium];
    const wordsPerChapter = Math.round(totalWords / 3);

    const call = vi.mocked(llmService.generateChapterScript).mock.calls[0]!;
    expect(call[0].targetWordCount).toBe(wordsPerChapter);
  });

  it('should pass previous chapters context for sequential generation', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    const calls = vi.mocked(llmService.generateChapterScript).mock.calls;
    // First chapter has no previous context
    expect(calls[0]![0].previousChaptersContext).toEqual([]);
    // Second chapter has first chapter's title as context
    expect(calls[1]![0].previousChaptersContext).toEqual(['Introduction']);
    // Third chapter has first two chapters' titles as context
    expect(calls[2]![0].previousChaptersContext).toEqual(['Introduction', 'Deep Dive']);
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
});
