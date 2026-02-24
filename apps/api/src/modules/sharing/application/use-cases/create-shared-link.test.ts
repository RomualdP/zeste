import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateSharedLink } from './create-shared-link';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SharedLinkRepositoryPort } from '../ports/shared-link-repository.port';
import { ProjectEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('CreateSharedLink', () => {
  let useCase: CreateSharedLink;
  let projectRepository: ProjectRepositoryPort;
  let sharedLinkRepository: SharedLinkRepositoryPort;

  beforeEach(() => {
    const project = ProjectEntity.create('p1', 'user-1', 'Test')
      .configure(Tone.Debate, TargetDuration.Medium, 3)
      .startProcessing()
      .markReady();

    projectRepository = {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    sharedLinkRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn().mockResolvedValue(null),
      save: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new CreateSharedLink(projectRepository, sharedLinkRepository);
  });

  it('should create a shared link for a ready project', async () => {
    const link = await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(link.projectId).toBe('p1');
    expect(link.isActive).toBe(true);
    expect(link.slug).toBeTruthy();
    expect(sharedLinkRepository.save).toHaveBeenCalled();
  });

  it('should return existing active link if one exists', async () => {
    const existingLink = { id: 'sl1', projectId: 'p1', slug: 'existing', isActive: true, createdAt: '' };
    vi.mocked(sharedLinkRepository.findByProjectId).mockResolvedValue(existingLink as any);

    const link = await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(link.slug).toBe('existing');
    expect(sharedLinkRepository.save).not.toHaveBeenCalled();
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

  it('should reject when project is not ready', async () => {
    const draftProject = ProjectEntity.create('p1', 'user-1', 'Test');
    vi.mocked(projectRepository.findById).mockResolvedValue(draftProject);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('Project must be ready');
  });
});
