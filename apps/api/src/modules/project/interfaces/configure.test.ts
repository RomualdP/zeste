import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { configureRoutes } from './configure';
import { ProjectEntity, SourceEntity } from '@zeste/domain';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../application/ports/source-repository.port';

function createMocks() {
  const ingestedSource = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested('content');

  return {
    authService: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      verifyToken: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
      deleteUser: vi.fn(),
    } as AuthServicePort,

    userRepository: {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as UserRepositoryPort,

    projectRepository: {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test')),
      findByUserId: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    } as ProjectRepositoryPort,

    sourceRepository: {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([ingestedSource]),
      save: vi.fn(),
      delete: vi.fn(),
    } as SourceRepositoryPort,
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('sourceRepository', mocks.sourceRepository);
  app.register(configureRoutes, { prefix: '/api/projects/:id' });
  return app;
}

describe('PATCH /api/projects/:id/configure', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 200 with configured project', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/projects/p1/configure',
      headers: { authorization: 'Bearer valid-token' },
      payload: { tone: 'debate', targetDuration: 30, chapterCount: 5 },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.tone).toBe('debate');
    expect(body.data.targetDuration).toBe(30);
    expect(body.data.chapterCount).toBe(5);
    await app.close();
  });

  it('should return 400 on missing fields', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/projects/p1/configure',
      headers: { authorization: 'Bearer valid-token' },
      payload: { tone: 'debate' },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('should return 400 when no ingested sources', async () => {
    vi.mocked(mocks.sourceRepository.findByProjectId).mockResolvedValue([]);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/projects/p1/configure',
      headers: { authorization: 'Bearer valid-token' },
      payload: { tone: 'debate', targetDuration: 15, chapterCount: 3 },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/projects/p1/configure',
      payload: { tone: 'debate', targetDuration: 15, chapterCount: 3 },
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
