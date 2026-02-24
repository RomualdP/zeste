import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetProjectSources } from './get-project-sources';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectEntity, SourceEntity } from '@zeste/domain';

describe('GetProjectSources', () => {
  let useCase: GetProjectSources;
  let sourceRepository: SourceRepositoryPort;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    sourceRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([
        SourceEntity.createUrl('s1', 'p1', 'https://example.com'),
        SourceEntity.createUrl('s2', 'p1', 'https://other.com'),
      ]),
      save: vi.fn(),
      delete: vi.fn(),
    };
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test')),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetProjectSources(sourceRepository, projectRepository);
  });

  it('should return sources for a project owned by the user', async () => {
    const result = await useCase.execute({ projectId: 'p1', userId: 'user-1' });
    expect(result).toHaveLength(2);
    expect(sourceRepository.findByProjectId).toHaveBeenCalledWith('p1');
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
