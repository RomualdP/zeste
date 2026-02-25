import type { FastifyPluginAsync } from 'fastify';
import { CreateSharedLink } from '../application/use-cases/create-shared-link';
import { GetSharedLink } from '../application/use-cases/get-shared-link';
import { DeactivateSharedLink } from '../application/use-cases/deactivate-shared-link';
import type { SharedLinkRepositoryPort } from '../application/ports/shared-link-repository.port';
import type { AudioStoragePort } from '../../audio/application/ports/audio-storage.port';
import { requireAuth } from '../../../shared/middlewares/require-auth';

declare module 'fastify' {
  interface FastifyInstance {
    sharedLinkRepository: SharedLinkRepositoryPort;
    audioStorage: AudioStoragePort;
  }
}

export const sharingRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/projects/:id/share — create shared link (auth required)
  app.post('/api/projects/:id/share', {
    preHandler: requireAuth,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new CreateSharedLink(app.projectRepository, app.sharedLinkRepository);
      const link = await useCase.execute({
        userId: request.user!.id,
        projectId: id,
      });

      return reply.status(201).send({
        data: {
          id: link.id,
          projectId: link.projectId,
          slug: link.slug,
          isActive: link.isActive,
          createdAt: link.createdAt,
        },
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });

  // GET /api/shared/:slug — public route, no auth needed
  app.get('/api/shared/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    try {
      const useCase = new GetSharedLink(
        app.sharedLinkRepository,
        app.projectRepository,
        app.chapterRepository,
      );
      const result = await useCase.execute({ slug });

      // Generate signed audio URLs for each chapter
      const chaptersWithUrls = await Promise.all(
        result.chapters.map(async (ch) => ({
          id: ch.id,
          title: ch.title,
          summary: ch.summary,
          position: ch.position,
          audioPath: ch.audioPath,
          audioDuration: ch.audioDuration,
          audioUrl: ch.audioPath ? await app.audioStorage.getUrl(ch.audioPath) : null,
        })),
      );

      return reply.status(200).send({
        data: {
          project: {
            id: result.project.id,
            name: result.project.name,
            tone: result.project.tone,
            targetDuration: result.project.targetDuration,
          },
          chapters: chaptersWithUrls,
        },
      });
    } catch (err: any) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
  });

  // DELETE /api/projects/:id/share — deactivate shared link (auth required)
  app.delete('/api/projects/:id/share', {
    preHandler: requireAuth,
  }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new DeactivateSharedLink(app.projectRepository, app.sharedLinkRepository);
      await useCase.execute({
        userId: request.user!.id,
        projectId: id,
      });

      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });
};
