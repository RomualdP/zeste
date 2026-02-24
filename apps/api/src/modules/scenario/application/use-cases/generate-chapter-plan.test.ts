import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateChapterPlan } from './generate-chapter-plan';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../../project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { LlmServicePort } from '../ports/llm-service.port';
import { ProjectEntity, SourceEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('GenerateChapterPlan', () => {
  let useCase: GenerateChapterPlan;
  let projectRepository: ProjectRepositoryPort;
  let sourceRepository: SourceRepositoryPort;
  let chapterRepository: ChapterRepositoryPort;
  let llmService: LlmServicePort;

  const ingestedSource = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested('Some article content about AI');

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
      findByProjectId: vi.fn().mockResolvedValue([]),
      save: vi.fn(),
      saveAll: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    };
    llmService = {
      generateChapterPlan: vi.fn().mockResolvedValue([
        { title: 'Introduction', summary: 'Overview of the topic' },
        { title: 'Deep Dive', summary: 'Detailed analysis' },
        { title: 'Conclusion', summary: 'Key takeaways' },
      ]),
      generateChapterScript: vi.fn(),
    };

    useCase = new GenerateChapterPlan(projectRepository, sourceRepository, chapterRepository, llmService);
  });

  it('should generate a chapter plan from project sources', async () => {
    const chapters = await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(chapters).toHaveLength(3);
    expect(chapters[0]!.title).toBe('Introduction');
    expect(chapters[0]!.summary).toBe('Overview of the topic');
    expect(chapters[0]!.position).toBe(0);
    expect(chapters[1]!.position).toBe(1);
    expect(chapters[2]!.position).toBe(2);
    expect(chapterRepository.saveAll).toHaveBeenCalledWith(chapters);
  });

  it('should pass source contents and tone to LLM', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(llmService.generateChapterPlan).toHaveBeenCalledWith({
      sources: ['Some article content about AI'],
      tone: Tone.Debate,
      chapterCount: 3,
    });
  });

  it('should delete existing chapters before generating new plan', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(chapterRepository.deleteByProjectId).toHaveBeenCalledWith('p1');
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

  it('should reject when no ingested sources', async () => {
    vi.mocked(sourceRepository.findByProjectId).mockResolvedValue([]);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('at least one ingested source');
  });
});
