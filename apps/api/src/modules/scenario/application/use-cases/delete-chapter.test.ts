import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteChapter } from './delete-chapter';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import { ProjectEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('DeleteChapter', () => {
  let useCase: DeleteChapter;
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

    useCase = new DeleteChapter(projectRepository, chapterRepository);
  });

  it('should delete a chapter', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1', chapterId: 'ch2' });

    expect(chapterRepository.delete).toHaveBeenCalledWith('ch2');
  });

  it('should reject when only one chapter remains', async () => {
    vi.mocked(chapterRepository.findByProjectId).mockResolvedValue([chapters[0]!]);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', chapterId: 'ch1' }),
    ).rejects.toThrow('at least one chapter');
  });

  it('should reject when chapter not found in project', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', chapterId: 'unknown' }),
    ).rejects.toThrow('Chapter not found');
  });

  it('should reject when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', chapterId: 'ch1' }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when user does not own the project', async () => {
    await expect(
      useCase.execute({ userId: 'other-user', projectId: 'p1', chapterId: 'ch1' }),
    ).rejects.toThrow('Project not found');
  });
});
