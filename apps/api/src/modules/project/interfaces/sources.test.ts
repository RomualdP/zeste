import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { sourceRoutes } from './sources';
import { ProjectEntity, SourceEntity } from '@zeste/domain';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../application/ports/source-repository.port';
import type { IngestionServicePort } from '../application/ports/ingestion-service.port';

function createMocks() {
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
      save: vi.fn(),
      delete: vi.fn(),
    } as ProjectRepositoryPort,

    sourceRepository: {
      findById: vi.fn().mockResolvedValue(SourceEntity.createUrl('s1', 'p1', 'https://example.com')),
      findByProjectId: vi.fn().mockResolvedValue([
        SourceEntity.createUrl('s1', 'p1', 'https://example.com'),
      ]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    } as SourceRepositoryPort,

    ingestionService: {
      ingestUrl: vi.fn().mockResolvedValue({ content: '# Content' }),
      ingestPdf: vi.fn().mockResolvedValue({ content: '# PDF' }),
    } as IngestionServicePort,
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('sourceRepository', mocks.sourceRepository);
  app.decorate('ingestionService', mocks.ingestionService);
  app.register(sourceRoutes, { prefix: '/api/projects/:projectId/sources' });
  return app;
}

describe('Source Routes', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  describe('POST /api/projects/:projectId/sources', () => {
    it('should return 201 with created source', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects/p1/sources',
        headers: { authorization: 'Bearer valid-token' },
        payload: { type: 'url', url: 'https://example.com/article' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data.type).toBe('url');
      expect(body.data.status).toBeDefined();
      await app.close();
    });

    it('should return 400 on missing type', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects/p1/sources',
        headers: { authorization: 'Bearer valid-token' },
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      await app.close();
    });

    it('should return 401 without auth', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects/p1/sources',
        payload: { type: 'url', url: 'https://example.com' },
      });

      expect(response.statusCode).toBe(401);
      await app.close();
    });
  });

  describe('GET /api/projects/:projectId/sources', () => {
    it('should return 200 with sources list', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/p1/sources',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(1);
      await app.close();
    });
  });

  describe('DELETE /api/projects/:projectId/sources/:sourceId', () => {
    it('should return 204 on successful deletion', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/projects/p1/sources/s1',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(204);
      await app.close();
    });

    it('should return 404 when source not found', async () => {
      vi.mocked(mocks.sourceRepository.findById).mockResolvedValue(null);
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/projects/p1/sources/unknown',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(404);
      await app.close();
    });
  });
});
