import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './interfaces/http/routes/health';
import { authRoutes } from './interfaces/http/routes/auth';
import { errorHandler } from './interfaces/http/plugins/error-handler';
import type { AuthServicePort } from './application/ports/auth-service.port';
import type { UserRepositoryPort } from './application/ports/user-repository.port';

interface AppDependencies {
  authService?: AuthServicePort;
  userRepository?: UserRepositoryPort;
}

export function createApp(deps: AppDependencies = {}) {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Decorate with dependencies (will be injected at startup)
  if (deps.authService) app.decorate('authService', deps.authService);
  if (deps.userRepository) app.decorate('userRepository', deps.userRepository);

  app.register(cors);
  app.register(errorHandler);
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/auth' });

  return app;
}
