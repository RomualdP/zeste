import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetUserProjects } from './get-user-projects';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectEntity } from '@zeste/domain';

describe('GetUserProjects', () => {
  let useCase: GetUserProjects;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    projectRepository = {
      findById: vi.fn(),
      findByUserId: vi.fn().mockResolvedValue([
        ProjectEntity.create('p1', 'user-1', 'Podcast 1'),
        ProjectEntity.create('p2', 'user-1', 'Podcast 2'),
      ]),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetUserProjects(projectRepository);
  });

  it('should return projects for a user', async () => {
    const result = await useCase.execute({ userId: 'user-1' });
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe('Podcast 1');
    expect(result[1]!.name).toBe('Podcast 2');
    expect(projectRepository.findByUserId).toHaveBeenCalledWith('user-1');
  });

  it('should return empty array when user has no projects', async () => {
    vi.mocked(projectRepository.findByUserId).mockResolvedValue([]);
    const result = await useCase.execute({ userId: 'user-1' });
    expect(result).toEqual([]);
  });
});
