import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProject } from './get-project';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectEntity } from '@zeste/domain';

describe('GetProject', () => {
  let useCase: GetProject;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Mon podcast')),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetProject(projectRepository);
  });

  it('should return a project by id for the owner', async () => {
    const result = await useCase.execute({ projectId: 'p1', userId: 'user-1' });
    expect(result.id).toBe('p1');
    expect(result.name).toBe('Mon podcast');
  });

  it('should throw when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);
    await expect(
      useCase.execute({ projectId: 'p1', userId: 'user-1' }),
    ).rejects.toThrow('Project not found');
  });

  it('should throw when user is not the owner', async () => {
    await expect(
      useCase.execute({ projectId: 'p1', userId: 'other-user' }),
    ).rejects.toThrow('Project not found');
  });
});
