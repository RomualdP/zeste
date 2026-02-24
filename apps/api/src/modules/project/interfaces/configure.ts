import type { FastifyPluginAsync } from 'fastify';
import { ConfigureProject } from '../application/use-cases/configure-project';
import { requireAuth } from '../../../shared/middlewares/require-auth';

export const configureRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // PATCH /configure — configure project tone, duration, chapters
  app.patch('/configure', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { tone, targetDuration, chapterCount } = request.body as {
      tone?: string;
      targetDuration?: number;
      chapterCount?: number;
    };

    console.log('[CONFIGURE] Received:', { id, tone, targetDuration, chapterCount });

    if (!tone || targetDuration === undefined || chapterCount === undefined) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'tone, targetDuration and chapterCount are required' },
      });
    }

    try {
      const useCase = new ConfigureProject(app.projectRepository, app.sourceRepository);
      const project = await useCase.execute({
        userId: request.user!.id,
        projectId: id,
        tone: tone as any,
        targetDuration: targetDuration as any,
        chapterCount,
      });

      console.log('[CONFIGURE] Saved:', { tone: project.tone, targetDuration: project.targetDuration, chapterCount: project.chapterCount });

      return reply.status(200).send({
        data: {
          id: project.id,
          userId: project.userId,
          name: project.name,
          tone: project.tone,
          targetDuration: project.targetDuration,
          chapterCount: project.chapterCount,
          status: project.status,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });
};
