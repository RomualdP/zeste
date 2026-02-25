import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteProject } from './delete-project';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectEntity } from '@zeste/domain';

describe('DeleteProject', () => {
  let useCase: DeleteProject;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test')),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteProject(projectRepository);
  });

  it('should delete a project', async () => {
    await useCase.execute({ projectId: 'p1', userId: 'user-1' });
    expect(projectRepository.delete).toHaveBeenCalledWith('p1');
  });

  it('should throw when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);
    await expect(
      useCase.execute({ projectId: 'p1', userId: 'user-1' }),
    ).rejects.toThrow('Project not found');
  });

  it('should throw when user does not own the project', async () => {
    await expect(
      useCase.execute({ projectId: 'p1', userId: 'other-user' }),
    ).rejects.toThrow('Project not found');
  });
});
