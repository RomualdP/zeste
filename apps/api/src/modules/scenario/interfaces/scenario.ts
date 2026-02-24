import type { FastifyPluginAsync } from 'fastify';
import { GenerateChapterPlan } from '../application/use-cases/generate-chapter-plan';
import { GenerateScenario } from '../application/use-cases/generate-scenario';
import type { ChapterRepositoryPort } from '../application/ports/chapter-repository.port';
import type { LlmServicePort } from '../application/ports/llm-service.port';
import { requireAuth } from '../../../shared/middlewares/require-auth';

declare module 'fastify' {
  interface FastifyInstance {
    chapterRepository: ChapterRepositoryPort;
    llmService: LlmServicePort;
  }
}

function serializeChapter(chapter: {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  position: number;
  script: unknown[];
  audioPath: string | null;
  audioDuration: number | null;
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
    audioPath: chapter.audioPath,
    audioDuration: chapter.audioDuration,
    status: chapter.status,
    createdAt: chapter.createdAt,
  };
}

export const scenarioRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // POST /generate-plan — generate chapter plan from sources via LLM
  app.post('/generate-plan', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new GenerateChapterPlan(
        app.projectRepository,
        app.sourceRepository,
        app.chapterRepository,
        app.llmService,
      );
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

  // POST /generate — generate full scenario scripts for all chapters
  app.post('/generate', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new GenerateScenario(
        app.projectRepository,
        app.sourceRepository,
        app.chapterRepository,
        app.llmService,
      );
      const chapters = await useCase.execute({
        userId: request.user!.id,
        projectId: id,
      });

      return reply.status(202).send({ data: chapters.map(serializeChapter) });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });
};
