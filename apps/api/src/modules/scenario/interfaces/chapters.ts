import type { FastifyPluginAsync } from 'fastify';
import { GetChapters } from '../application/use-cases/get-chapters';
import { ReorderChapters } from '../application/use-cases/reorder-chapters';
import { DeleteChapter } from '../application/use-cases/delete-chapter';
import { requireAuth } from '../../../shared/middlewares/require-auth';

function serializeChapter(chapter: {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  position: number;
  script: unknown[];
  status: string;
  createdAt: string;
}) {
  return {
    id: chapter.id,
    projectId: chapter.projectId,
    title: chapter.title,
    summary: chapter.summary,
    position: chapter.position,
    script: chapter.script,
    status: chapter.status,
    createdAt: chapter.createdAt,
  };
}

export const chapterRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // GET /chapters — list chapters ordered by position
  app.get('/chapters', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new GetChapters(app.projectRepository, app.chapterRepository);
      const chapters = await useCase.execute({
        userId: request.user!.id,
        projectId: id,
      });

      return reply.status(200).send({ data: chapters.map(serializeChapter) });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });

  // PATCH /chapters/reorder — batch update chapter positions
  app.patch('/chapters/reorder', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { order } = request.body as { order?: Array<{ chapterId: string; position: number }> };

    if (!order || !Array.isArray(order)) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'order is required' },
      });
    }

    try {
      const useCase = new ReorderChapters(app.projectRepository, app.chapterRepository);
      const chapters = await useCase.execute({
        userId: request.user!.id,
        projectId: id,
        order,
      });

      return reply.status(200).send({ data: chapters.map(serializeChapter) });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });

  // DELETE /chapters/:chapterId — delete a chapter
  app.delete('/chapters/:chapterId', async (request, reply) => {
    const { id, chapterId } = request.params as { id: string; chapterId: string };

    try {
      const useCase = new DeleteChapter(app.projectRepository, app.chapterRepository);
      await useCase.execute({
        userId: request.user!.id,
        projectId: id,
        chapterId,
      });

      return reply.status(204).send();
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });
};
