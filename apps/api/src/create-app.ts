import Fastify from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './shared/plugins/error-handler';
import { healthRoutes } from './shared/health';
import { authRoutes } from './modules/identity/interfaces/auth';
import { projectRoutes } from './modules/project/interfaces/projects';
import { sourceRoutes } from './modules/project/interfaces/sources';
import type { AuthServicePort } from './modules/identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from './modules/identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from './modules/project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from './modules/project/application/ports/source-repository.port';
import type { IngestionServicePort } from './modules/project/application/ports/ingestion-service.port';

interface AppDependencies {
  authService?: AuthServicePort;
  userRepository?: UserRepositoryPort;
  projectRepository?: ProjectRepositoryPort;
  sourceRepository?: SourceRepositoryPort;
  ingestionService?: IngestionServicePort;
}

export function createApp(deps: AppDependencies = {}) {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Decorate with dependencies (will be injected at startup)
  if (deps.authService) app.decorate('authService', deps.authService);
  if (deps.userRepository) app.decorate('userRepository', deps.userRepository);
  if (deps.projectRepository) app.decorate('projectRepository', deps.projectRepository);
  if (deps.sourceRepository) app.decorate('sourceRepository', deps.sourceRepository);
  if (deps.ingestionService) app.decorate('ingestionService', deps.ingestionService);

  app.register(cors);
  app.register(errorHandler);
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(projectRoutes, { prefix: '/api/projects' });
  app.register(sourceRoutes, { prefix: '/api/projects/:projectId/sources' });

  return app;
}
