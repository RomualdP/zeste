import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { chapterRoutes } from './chapters';
import { ProjectEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../application/ports/chapter-repository.port';

function createMocks() {
  const project = ProjectEntity.create('p1', 'user-1', 'Test').configure(Tone.Debate, TargetDuration.Medium, 3);
  const chapters = [
    ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0),
    ChapterEntity.create('ch2', 'p1', 'Main', 'Details', 1),
    ChapterEntity.create('ch3', 'p1', 'Conclusion', 'Summary', 2),
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
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('chapterRepository', mocks.chapterRepository);
  app.register(chapterRoutes, { prefix: '/api/projects/:id' });
  return app;
}

describe('GET /api/projects/:id/chapters', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 200 with ordered chapters', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/p1/chapters',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(3);
    expect(body.data[0].title).toBe('Intro');
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/p1/chapters',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});

describe('PATCH /api/projects/:id/chapters/reorder', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 200 with reordered chapters', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/projects/p1/chapters/reorder',
      headers: { authorization: 'Bearer valid-token' },
      payload: {
        order: [
          { chapterId: 'ch3', position: 0 },
          { chapterId: 'ch1', position: 1 },
          { chapterId: 'ch2', position: 2 },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(3);
    await app.close();
  });

  it('should return 400 on missing order', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/projects/p1/chapters/reorder',
      headers: { authorization: 'Bearer valid-token' },
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});

describe('DELETE /api/projects/:id/chapters/:chapterId', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 204 on successful deletion', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/p1/chapters/ch2',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(204);
    await app.close();
  });

  it('should return 400 when only one chapter remains', async () => {
    const singleChapter = [ChapterEntity.create('ch1', 'p1', 'Only', 'Only chapter', 0)];
    vi.mocked(mocks.chapterRepository.findByProjectId).mockResolvedValue(singleChapter);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/p1/chapters/ch1',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'DELETE',
      url: '/api/projects/p1/chapters/ch2',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });
});
