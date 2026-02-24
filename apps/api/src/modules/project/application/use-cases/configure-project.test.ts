import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigureProject } from './configure-project';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import { ProjectEntity, SourceEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';

describe('ConfigureProject', () => {
  let useCase: ConfigureProject;
  let projectRepository: ProjectRepositoryPort;
  let sourceRepository: SourceRepositoryPort;

  const ingestedSource = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested('content');

  beforeEach(() => {
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test')),
      findByUserId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    sourceRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([ingestedSource]),
      save: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new ConfigureProject(projectRepository, sourceRepository);
  });

  it('should configure a project with valid parameters', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      tone: Tone.Debate,
      targetDuration: TargetDuration.Long,
      chapterCount: 5,
    });

    expect(result.tone).toBe(Tone.Debate);
    expect(result.targetDuration).toBe(TargetDuration.Long);
    expect(result.chapterCount).toBe(5);
    expect(projectRepository.save).toHaveBeenCalled();
  });

  it('should reject when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: TargetDuration.Medium, chapterCount: 3 }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when user does not own the project', async () => {
    await expect(
      useCase.execute({ userId: 'other-user', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: TargetDuration.Medium, chapterCount: 3 }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when project has no ingested sources', async () => {
    vi.mocked(sourceRepository.findByProjectId).mockResolvedValue([]);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: TargetDuration.Medium, chapterCount: 3 }),
    ).rejects.toThrow('at least one ingested source');
  });

  it('should reject when chapter count exceeds max for duration (5min → max 2)', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: TargetDuration.Short, chapterCount: 3 }),
    ).rejects.toThrow('Maximum 2 chapters');
  });

  it('should reject when chapter count exceeds max for duration (15min → max 4)', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: TargetDuration.Medium, chapterCount: 5 }),
    ).rejects.toThrow('Maximum 4 chapters');
  });

  it('should allow max chapters for 30min duration', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      tone: Tone.Interview,
      targetDuration: TargetDuration.Long,
      chapterCount: 6,
    });

    expect(result.chapterCount).toBe(6);
  });
});
