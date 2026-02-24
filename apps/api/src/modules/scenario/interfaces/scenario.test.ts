import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { scenarioRoutes } from './scenario';
import { ProjectEntity, SourceEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../../project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../application/ports/chapter-repository.port';
import type { LlmServicePort } from '../application/ports/llm-service.port';

function createMocks() {
  const project = ProjectEntity.create('p1', 'user-1', 'Test').configure(Tone.Debate, TargetDuration.Medium, 3);
  const ingestedSource = SourceEntity.createUrl('s1', 'p1', 'https://example.com').markIngested('content');
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

    sourceRepository: {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([ingestedSource]),
      save: vi.fn(),
      delete: vi.fn(),
    } as SourceRepositoryPort,

    chapterRepository: {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(chapters),
      save: vi.fn(),
      saveAll: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    } as ChapterRepositoryPort,

    llmService: {
      generateChapterPlan: vi.fn().mockResolvedValue([
        { title: 'Intro', summary: 'Overview' },
        { title: 'Main', summary: 'Details' },
        { title: 'Conclusion', summary: 'Summary' },
      ]),
      generateChapterScript: vi.fn().mockResolvedValue([
        { speaker: 'host', text: 'Hello', tone: 'enthusiastic' },
        { speaker: 'expert', text: 'Hi', tone: 'friendly' },
      ]),
    } as LlmServicePort,
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('sourceRepository', mocks.sourceRepository);
  app.decorate('chapterRepository', mocks.chapterRepository);
  app.decorate('llmService', mocks.llmService);
  app.register(scenarioRoutes, { prefix: '/api/projects/:id' });
  return app;
}

describe('POST /api/projects/:id/generate-plan', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 200 with chapter plan', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-plan',
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
      method: 'POST',
      url: '/api/projects/p1/generate-plan',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('should return 400 when no ingested sources', async () => {
    vi.mocked(mocks.sourceRepository.findByProjectId).mockResolvedValue([]);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-plan',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});

describe('POST /api/projects/:id/generate', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 202 and start generation', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(202);
    const body = response.json();
    expect(body.data).toHaveLength(3);
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('should return 400 when no chapters exist', async () => {
    vi.mocked(mocks.chapterRepository.findByProjectId).mockResolvedValue([]);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
