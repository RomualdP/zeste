import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { generationRoutes } from './generation';
import { ProjectEntity } from '@zeste/domain';
import { GenerationPhase, Tone, TargetDuration } from '@zeste/shared';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../../project/application/ports/project-repository.port';
import type { GenerationStatusRepositoryPort } from '../../project/application/ports/generation-status-repository.port';
import type { GenerateFullJobPayload } from '../../../infrastructure/jobs/generate-full-worker';

interface FakeQueue {
  add: ReturnType<typeof vi.fn>;
}

function createMocks() {
  const project = ProjectEntity.create('p1', 'user-1', 'Test')
    .configure(Tone.Debate, TargetDuration.Medium, 3);

  return {
    authService: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      verifyToken: vi.fn().mockResolvedValue({ id: 'user-1', email: 't@e.com' }),
      deleteUser: vi.fn(),
    } as AuthServicePort,
    userRepository: {
      findById: vi.fn().mockResolvedValue({ id: 'user-1' }),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as UserRepositoryPort,
    projectRepository: {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as ProjectRepositoryPort,
    generationStatusRepository: {
      getStatus: vi.fn().mockResolvedValue({ phase: GenerationPhase.Plan, progress: 0.1, error: null }),
      updatePhase: vi.fn(),
      setError: vi.fn(),
    } as GenerationStatusRepositoryPort,
    generationQueue: {
      add: vi.fn().mockResolvedValue({ id: 'job-42' }),
    } as FakeQueue,
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('generationStatusRepository', mocks.generationStatusRepository);
  app.decorate('generationQueue', mocks.generationQueue as unknown as {
    add: (name: string, payload: GenerateFullJobPayload) => Promise<{ id?: string }>;
  });
  app.register(generationRoutes, { prefix: '/api/projects/:id' });
  return app;
}

describe('POST /api/projects/:id/generate-full', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('returns 202 with jobId and enqueues the job', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-full',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toEqual({ data: { jobId: 'job-42' } });
    expect(mocks.generationQueue.add).toHaveBeenCalledWith('generate-full', {
      userId: 'user-1',
      projectId: 'p1',
    });
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-full',
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 404 when the project does not belong to the user', async () => {
    const otherProject = ProjectEntity.create('p1', 'someone-else', 'X')
      .configure(Tone.Debate, TargetDuration.Medium, 3);
    vi.mocked(mocks.projectRepository.findById).mockResolvedValue(otherProject);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-full',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(404);
    expect(mocks.generationQueue.add).not.toHaveBeenCalled();
    await app.close();
  });

  it('returns 400 when target duration exceeds quota', async () => {
    const overQuota = ProjectEntity.create('p1', 'user-1', 'X')
      .configure(Tone.Debate, 61 as TargetDuration, 3);
    vi.mocked(mocks.projectRepository.findById).mockResolvedValue(overQuota);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-full',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(400);
    expect(mocks.generationQueue.add).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /api/projects/:id/generation-status', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('returns current phase and progress', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/p1/generation-status',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: { phase: 'plan', progress: 0.1, error: null },
    });
    await app.close();
  });

  it('returns 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/p1/generation-status',
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('returns 404 when project not found for user', async () => {
    vi.mocked(mocks.projectRepository.findById).mockResolvedValue(null);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/p1/generation-status',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(404);
    await app.close();
  });

  it('returns 200 with idle status when no row yet', async () => {
    vi.mocked(mocks.generationStatusRepository.getStatus).mockResolvedValue(null);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/p1/generation-status',
      headers: { authorization: 'Bearer valid-token' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: { phase: 'idle', progress: 0, error: null },
    });
    await app.close();
  });
});
