import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { projectRoutes } from './projects';
import { ProjectEntity } from '@zeste/domain';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../application/ports/project-repository.port';

function createMocks() {
  const authService: AuthServicePort = {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
    deleteUser: vi.fn(),
  };

  const userRepository: UserRepositoryPort = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  const projectRepository: ProjectRepositoryPort = {
    findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test Project')),
    findByUserId: vi.fn().mockResolvedValue([
      ProjectEntity.create('p1', 'user-1', 'Project 1'),
      ProjectEntity.create('p2', 'user-1', 'Project 2'),
    ]),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
  };

  return { authService, userRepository, projectRepository };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.register(projectRoutes, { prefix: '/api/projects' });
  return app;
}

describe('Project Routes', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  describe('POST /api/projects', () => {
    it('should return 201 with created project', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: { authorization: 'Bearer valid-token' },
        payload: { name: 'Mon podcast' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data.name).toBe('Mon podcast');
      expect(body.data.status).toBe('draft');
      expect(body.data.id).toBeDefined();
      await app.close();
    });

    it('should return 400 on empty name', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: { authorization: 'Bearer valid-token' },
        payload: { name: '' },
      });

      expect(response.statusCode).toBe(400);
      await app.close();
    });

    it('should return 401 without auth token', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: 'Test' },
      });

      expect(response.statusCode).toBe(401);
      await app.close();
    });
  });

  describe('GET /api/projects', () => {
    it('should return 200 with user projects', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe('Project 1');
      await app.close();
    });

    it('should return 401 without auth token', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects',
      });

      expect(response.statusCode).toBe(401);
      await app.close();
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return 200 with project detail', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/p1',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.id).toBe('p1');
      expect(body.data.name).toBe('Test Project');
      await app.close();
    });

    it('should return 404 when project not found', async () => {
      vi.mocked(mocks.projectRepository.findById).mockResolvedValue(null);
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/unknown',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(404);
      await app.close();
    });

    it('should return 404 when user is not owner', async () => {
      vi.mocked(mocks.projectRepository.findById).mockResolvedValue(
        ProjectEntity.create('p1', 'other-user', 'Not mine'),
      );
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/p1',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(404);
      await app.close();
    });
  });
});
