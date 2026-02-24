import Fastify from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './shared/plugins/error-handler';
import { healthRoutes } from './shared/health';
import { authRoutes } from './modules/identity/interfaces/auth';
import { projectRoutes } from './modules/project/interfaces/projects';
import { sourceRoutes } from './modules/project/interfaces/sources';
import { configureRoutes } from './modules/project/interfaces/configure';
import { scenarioRoutes } from './modules/scenario/interfaces/scenario';
import { chapterRoutes } from './modules/scenario/interfaces/chapters';
import { audioRoutes } from './modules/audio/interfaces/audio';
import { sharingRoutes } from './modules/sharing/interfaces/sharing';
import type { AuthServicePort } from './modules/identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from './modules/identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from './modules/project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from './modules/project/application/ports/source-repository.port';
import type { IngestionServicePort } from './modules/project/application/ports/ingestion-service.port';
import type { ChapterRepositoryPort } from './modules/scenario/application/ports/chapter-repository.port';
import type { LlmServicePort } from './modules/scenario/application/ports/llm-service.port';
import type { TtsServicePort } from './modules/audio/application/ports/tts-service.port';
import type { AudioStoragePort } from './modules/audio/application/ports/audio-storage.port';
import type { SharedLinkRepositoryPort } from './modules/sharing/application/ports/shared-link-repository.port';

interface AppDependencies {
  authService?: AuthServicePort;
  userRepository?: UserRepositoryPort;
  projectRepository?: ProjectRepositoryPort;
  sourceRepository?: SourceRepositoryPort;
  ingestionService?: IngestionServicePort;
  chapterRepository?: ChapterRepositoryPort;
  llmService?: LlmServicePort;
  ttsService?: TtsServicePort;
  audioStorage?: AudioStoragePort;
  sharedLinkRepository?: SharedLinkRepositoryPort;
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
  if (deps.chapterRepository) app.decorate('chapterRepository', deps.chapterRepository);
  if (deps.llmService) app.decorate('llmService', deps.llmService);
  if (deps.ttsService) app.decorate('ttsService', deps.ttsService);
  if (deps.audioStorage) app.decorate('audioStorage', deps.audioStorage);
  if (deps.sharedLinkRepository) app.decorate('sharedLinkRepository', deps.sharedLinkRepository);

  app.register(cors);
  app.register(errorHandler);
  app.register(healthRoutes);
  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(projectRoutes, { prefix: '/api/projects' });
  app.register(sourceRoutes, { prefix: '/api/projects/:projectId/sources' });
  app.register(configureRoutes, { prefix: '/api/projects/:id' });
  app.register(scenarioRoutes, { prefix: '/api/projects/:id' });
  app.register(chapterRoutes, { prefix: '/api/projects/:id' });
  app.register(audioRoutes, { prefix: '/api/projects/:id' });
  app.register(sharingRoutes);

  return app;
}
