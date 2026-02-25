import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigureProject } from './configure-project';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import { ProjectEntity, SourceEntity } from '@zeste/domain';
import { Tone, maxChaptersForDuration } from '@zeste/shared';

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
      targetDuration: 30,
      chapterCount: 5,
    });

    expect(result.tone).toBe(Tone.Debate);
    expect(result.targetDuration).toBe(30);
    expect(result.chapterCount).toBe(5);
    expect(projectRepository.save).toHaveBeenCalled();
  });

  it('should accept any duration between 5 and 60', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      tone: Tone.Pedagogue,
      targetDuration: 23,
      chapterCount: 2,
    });

    expect(result.targetDuration).toBe(23);
    expect(result.chapterCount).toBe(2);
  });

  it('should reject when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: 15, chapterCount: 3 }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when user does not own the project', async () => {
    await expect(
      useCase.execute({ userId: 'other-user', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: 15, chapterCount: 3 }),
    ).rejects.toThrow('Project not found');
  });

  it('should reject when project has no ingested sources', async () => {
    vi.mocked(sourceRepository.findByProjectId).mockResolvedValue([]);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: 15, chapterCount: 3 }),
    ).rejects.toThrow('at least one ingested source');
  });

  it('should reject duration below minimum', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: 3, chapterCount: 1 }),
    ).rejects.toThrow('Duration must be between');
  });

  it('should reject duration above maximum', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: 90, chapterCount: 1 }),
    ).rejects.toThrow('Duration must be between');
  });

  it('should reject when chapter count exceeds max for given duration', async () => {
    const max5 = maxChaptersForDuration(5);
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', tone: Tone.Pedagogue, targetDuration: 5, chapterCount: max5 + 1 }),
    ).rejects.toThrow(`Maximum ${max5} chapters`);
  });

  it('should allow max chapters for 60min duration', async () => {
    const max60 = maxChaptersForDuration(60);
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      tone: Tone.Interview,
      targetDuration: 60,
      chapterCount: max60,
    });

    expect(result.chapterCount).toBe(max60);
  });
});
