import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateProject } from './create-project';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectStatus, Tone, TargetDuration } from '@zeste/shared';

describe('CreateProject', () => {
  let useCase: CreateProject;
  let projectRepository: ProjectRepositoryPort;

  beforeEach(() => {
    projectRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByUserId: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    useCase = new CreateProject(projectRepository);
  });

  it('should create a project with valid name', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Mon podcast',
    });

    expect(result.name).toBe('Mon podcast');
    expect(result.userId).toBe('user-1');
    expect(result.status).toBe(ProjectStatus.Draft);
    expect(result.tone).toBe(Tone.Pedagogue);
    expect(result.targetDuration).toBe(TargetDuration.Medium);
    expect(result.id).toBeDefined();
    expect(projectRepository.save).toHaveBeenCalled();
  });

  it('should reject empty name', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', name: '' }),
    ).rejects.toThrow('Project name must be between');
  });

  it('should reject name over 100 characters', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', name: 'A'.repeat(101) }),
    ).rejects.toThrow('Project name must be between');
  });

  it('should generate a unique id', async () => {
    const r1 = await useCase.execute({ userId: 'user-1', name: 'Project 1' });
    const r2 = await useCase.execute({ userId: 'user-1', name: 'Project 2' });
    expect(r1.id).not.toBe(r2.id);
  });
});
