import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { authRoutes } from './auth';
import type { AuthServicePort } from '../../../application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../../application/ports/user-repository.port';

function createMocks() {
  const authService: AuthServicePort = {
    register: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
    login: vi.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: { id: 'user-1', email: 'test@example.com' },
    }),
    logout: vi.fn().mockResolvedValue(undefined),
    verifyToken: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
    deleteUser: vi.fn().mockResolvedValue(undefined),
  };

  const userRepository: UserRepositoryPort = {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };

  return { authService, userRepository };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.register(authRoutes, { prefix: '/api/auth' });
  return app;
}

describe('Auth Routes', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 with user data on valid registration', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'Password1',
          displayName: 'Jean Dupont',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.data.id).toBe('user-1');
      expect(body.data.email).toBe('test@example.com');
      await app.close();
    });

    it('should return 400 on invalid email', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'not-email',
          password: 'Password1',
          displayName: 'Jean',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBeDefined();
      await app.close();
    });

    it('should return 400 on weak password', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'weak',
          displayName: 'Jean',
        },
      });

      expect(response.statusCode).toBe(400);
      await app.close();
    });

    it('should return 400 on missing fields', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: 'test@example.com' },
      });

      expect(response.statusCode).toBe(400);
      await app.close();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 with tokens on valid login', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'Password1',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.data.accessToken).toBe('access-token');
      expect(body.data.refreshToken).toBe('refresh-token');
      expect(body.data.user.id).toBe('user-1');
      await app.close();
    });

    it('should return 400 on invalid email', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'bad', password: 'Password1' },
      });

      expect(response.statusCode).toBe(400);
      await app.close();
    });

    it('should return 401 on wrong credentials', async () => {
      vi.mocked(mocks.authService.login).mockRejectedValue(new Error('Invalid credentials'));
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email: 'test@example.com', password: 'Wrong1234' },
      });

      expect(response.statusCode).toBe(401);
      await app.close();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(200);
      expect(mocks.authService.logout).toHaveBeenCalledWith('valid-token');
      await app.close();
    });

    it('should return 401 when no token provided', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/logout',
      });

      expect(response.statusCode).toBe(401);
      await app.close();
    });
  });

  describe('DELETE /api/auth/account', () => {
    it('should return 204 on successful deletion', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/auth/account',
        headers: { authorization: 'Bearer valid-token' },
      });

      expect(response.statusCode).toBe(204);
      expect(mocks.userRepository.delete).toHaveBeenCalledWith('user-1');
      expect(mocks.authService.deleteUser).toHaveBeenCalledWith('user-1');
      await app.close();
    });

    it('should return 401 when no token provided', async () => {
      const app = await buildApp(mocks);
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/auth/account',
      });

      expect(response.statusCode).toBe(401);
      await app.close();
    });
  });
});
