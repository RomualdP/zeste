import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeactivateSharedLink } from './deactivate-shared-link';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SharedLinkRepositoryPort } from '../ports/shared-link-repository.port';
import { ProjectEntity, SharedLinkEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('DeactivateSharedLink', () => {
  let useCase: DeactivateSharedLink;
  let projectRepository: ProjectRepositoryPort;
  let sharedLinkRepository: SharedLinkRepositoryPort;

  beforeEach(() => {
    const project = ProjectEntity.create('p1', 'user-1', 'Test')
      .configure(Tone.Debate, TargetDuration.Medium, 3)
      .startProcessing()
      .markReady();

    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');

    projectRepository = {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    sharedLinkRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(link),
      findBySlug: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };

    useCase = new DeactivateSharedLink(projectRepository, sharedLinkRepository);
  });

  it('should deactivate the shared link', async () => {
    await useCase.execute({ userId: 'user-1', projectId: 'p1' });

    expect(sharedLinkRepository.save).toHaveBeenCalled();
    const savedLink = vi.mocked(sharedLinkRepository.save).mock.calls[0]![0];
    expect(savedLink.isActive).toBe(false);
  });

  it('should reject when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when no shared link exists', async () => {
    vi.mocked(sharedLinkRepository.findByProjectId).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1' }),
    ).rejects.toThrow('No shared link found');
  });
});
