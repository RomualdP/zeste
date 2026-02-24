import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSharedLink } from './get-shared-link';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SharedLinkRepositoryPort } from '../ports/shared-link-repository.port';
import type { ChapterRepositoryPort } from '../../../scenario/application/ports/chapter-repository.port';
import { ProjectEntity, SharedLinkEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('GetSharedLink', () => {
  let useCase: GetSharedLink;
  let projectRepository: ProjectRepositoryPort;
  let sharedLinkRepository: SharedLinkRepositoryPort;
  let chapterRepository: ChapterRepositoryPort;

  beforeEach(() => {
    const project = ProjectEntity.create('p1', 'user-1', 'Test')
      .configure(Tone.Debate, TargetDuration.Medium, 3)
      .startProcessing()
      .markReady();

    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');
    const chapters = [
      ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0),
      ChapterEntity.create('ch2', 'p1', 'Main', 'Details', 1),
    ];

    projectRepository = {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    sharedLinkRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn(),
      findBySlug: vi.fn().mockResolvedValue(link),
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

    useCase = new GetSharedLink(sharedLinkRepository, projectRepository, chapterRepository);
  });

  it('should return project and chapters for a valid slug', async () => {
    const result = await useCase.execute({ slug: 'abc123' });

    expect(result.project.name).toBe('Test');
    expect(result.chapters).toHaveLength(2);
  });

  it('should reject when slug not found', async () => {
    vi.mocked(sharedLinkRepository.findBySlug).mockResolvedValue(null);

    await expect(
      useCase.execute({ slug: 'unknown' }),
    ).rejects.toThrow('Shared link not found');
  });

  it('should reject when link is inactive', async () => {
    const inactiveLink = SharedLinkEntity.create('sl1', 'p1', 'abc123').deactivate();
    vi.mocked(sharedLinkRepository.findBySlug).mockResolvedValue(inactiveLink);

    await expect(
      useCase.execute({ slug: 'abc123' }),
    ).rejects.toThrow('Shared link is no longer active');
  });
});
