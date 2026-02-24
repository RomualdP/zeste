import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { sharingRoutes } from './sharing';
import { ProjectEntity, SharedLinkEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../../scenario/application/ports/chapter-repository.port';
import type { SharedLinkRepositoryPort } from '../application/ports/shared-link-repository.port';

function createMocks() {
  const project = ProjectEntity.create('p1', 'user-1', 'Test')
    .configure(Tone.Debate, TargetDuration.Medium, 3)
    .startProcessing()
    .markReady();

  const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');
  const chapters = [
    ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0),
    ChapterEntity.create('ch2', 'p1', 'Main', 'Details', 1),
  ];

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
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as ProjectRepositoryPort,

    chapterRepository: {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(chapters),
      save: vi.fn(),
      saveAll: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    } as ChapterRepositoryPort,

    sharedLinkRepository: {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(null),
      findBySlug: vi.fn().mockResolvedValue(link),
      save: vi.fn(),
      delete: vi.fn(),
    } as SharedLinkRepositoryPort,
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('chapterRepository', mocks.chapterRepository);
  app.decorate('sharedLinkRepository', mocks.sharedLinkRepository);
  app.register(sharingRoutes);
  return app;
}

describe('POST /api/projects/:id/share', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 201 with shared link', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/share',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.data.projectId).toBe('p1');
    expect(body.data.slug).toBeTruthy();
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/share',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});

describe('GET /api/shared/:slug', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 200 with project and chapters (no auth required)', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/shared/abc123',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.project.name).toBe('Test');
    expect(body.data.chapters).toHaveLength(2);
    await app.close();
  });

  it('should return 404 when slug not found', async () => {
    vi.mocked(mocks.sharedLinkRepository.findBySlug).mockResolvedValue(null);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/shared/unknown',
    });

    expect(response.statusCode).toBe(404);
    await app.close();
  });
});

describe('DELETE /api/projects/:id/share', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');
    vi.mocked(mocks.sharedLinkRepository.findByProjectId).mockResolvedValue(link);
  });

  it('should return 204 on successful deactivation', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/p1/share',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(204);
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/p1/share',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
