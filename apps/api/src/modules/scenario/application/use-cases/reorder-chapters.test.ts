import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReorderChapters } from './reorder-chapters';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import { ProjectEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('ReorderChapters', () => {
  let useCase: ReorderChapters;
  let projectRepository: ProjectRepositoryPort;
  let chapterRepository: ChapterRepositoryPort;

  const chapters = [
    ChapterEntity.create('ch1', 'p1', 'Introduction', 'Overview', 0),
    ChapterEntity.create('ch2', 'p1', 'Deep Dive', 'Analysis', 1),
    ChapterEntity.create('ch3', 'p1', 'Conclusion', 'Takeaways', 2),
  ];

  beforeEach(() => {
    const project = ProjectEntity.create('p1', 'user-1', 'Test').configure(Tone.Debate, TargetDuration.Medium, 3);

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

    useCase = new ReorderChapters(projectRepository, chapterRepository);
  });

  it('should reorder chapters with new positions', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      order: [
        { chapterId: 'ch3', position: 0 },
        { chapterId: 'ch1', position: 1 },
        { chapterId: 'ch2', position: 2 },
      ],
    });

    expect(result).toHaveLength(3);
    expect(result.find((c) => c.id === 'ch3')!.position).toBe(0);
    expect(result.find((c) => c.id === 'ch1')!.position).toBe(1);
    expect(result.find((c) => c.id === 'ch2')!.position).toBe(2);
    expect(chapterRepository.saveAll).toHaveBeenCalled();
  });

  it('should reject when a chapter ID does not exist', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'p1',
        order: [
          { chapterId: 'ch1', position: 0 },
          { chapterId: 'unknown', position: 1 },
        ],
      }),
    ).rejects.toThrow('Chapter not found: unknown');
  });

  it('should reject when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        projectId: 'p1',
        order: [{ chapterId: 'ch1', position: 0 }],
      }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when user does not own the project', async () => {
    await expect(
      useCase.execute({
        userId: 'other-user',
        projectId: 'p1',
        order: [{ chapterId: 'ch1', position: 0 }],
      }),
    ).rejects.toThrow('Project not found');
  });
});
