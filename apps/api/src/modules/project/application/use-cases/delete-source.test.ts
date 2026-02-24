import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteSource } from './delete-source';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectEntity, SourceEntity } from '@zeste/domain';

describe('DeleteSource', () => {
  let useCase: DeleteSource;
  let sourceRepository: SourceRepositoryPort;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    sourceRepository = {
      findById: vi.fn().mockResolvedValue(SourceEntity.createUrl('s1', 'p1', 'https://example.com')),
      findByProjectId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test')),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new DeleteSource(sourceRepository, projectRepository);
  });

  it('should delete a source', async () => {
    await useCase.execute({ sourceId: 's1', projectId: 'p1', userId: 'user-1' });
    expect(sourceRepository.delete).toHaveBeenCalledWith('s1');
  });

  it('should throw when source not found', async () => {
    vi.mocked(sourceRepository.findById).mockResolvedValue(null);
    await expect(
      useCase.execute({ sourceId: 's1', projectId: 'p1', userId: 'user-1' }),
    ).rejects.toThrow('Source not found');
  });

  it('should throw when source does not belong to the project', async () => {
    vi.mocked(sourceRepository.findById).mockResolvedValue(
      SourceEntity.createUrl('s1', 'other-project', 'https://example.com'),
    );
    await expect(
      useCase.execute({ sourceId: 's1', projectId: 'p1', userId: 'user-1' }),
    ).rejects.toThrow('Source not found');
  });

  it('should throw when user does not own the project', async () => {
    await expect(
      useCase.execute({ sourceId: 's1', projectId: 'p1', userId: 'other-user' }),
    ).rejects.toThrow('Project not found');
  });
});
