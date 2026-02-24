import type { FastifyPluginAsync } from 'fastify';
import { AddSource } from '../application/use-cases/add-source';
import { GetProjectSources } from '../application/use-cases/get-project-sources';
import { DeleteSource } from '../application/use-cases/delete-source';
import type { SourceRepositoryPort } from '../application/ports/source-repository.port';
import type { IngestionServicePort } from '../application/ports/ingestion-service.port';
import { requireAuth } from '../../../shared/middlewares/require-auth';

declare module 'fastify' {
  interface FastifyInstance {
    sourceRepository: SourceRepositoryPort;
    ingestionService: IngestionServicePort;
  }
}

function serializeSource(source: { id: string; projectId: string; type: string; url: string | null; filePath: string | null; rawContent: string; status: string; errorMessage: string | null; createdAt: string; wordCount: number }) {
  return {
    id: source.id,
    projectId: source.projectId,
    type: source.type,
    url: source.url,
    filePath: source.filePath,
    status: source.status,
    errorMessage: source.errorMessage,
    wordCount: source.wordCount,
    createdAt: source.createdAt,
  };
}

export const sourceRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // POST / — add source
  app.post('/', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const { type, url, filePath } = request.body as { type?: string; url?: string; filePath?: string };

    if (!type) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'type is required (url or pdf)' },
      });
    }

    try {
      const useCase = new AddSource(app.sourceRepository, app.projectRepository, app.ingestionService);
      const source = await useCase.execute({
        userId: request.user!.id,
        projectId,
        type: type as any,
        url,
        filePath,
      });
      return reply.status(201).send({ data: serializeSource(source) });
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return reply.status(isNotFound ? 404 : 400).send({
        error: { code: isNotFound ? 'NOT_FOUND' : 'VALIDATION_ERROR', message: err.message },
      });
    }
  });

  // GET / — list sources
  app.get('/', async (request, reply) => {
    const { projectId } = request.params as { projectId: string };

    try {
      const useCase = new GetProjectSources(app.sourceRepository, app.projectRepository);
      const sources = await useCase.execute({ projectId, userId: request.user!.id });
      return reply.status(200).send({ data: sources.map(serializeSource) });
    } catch (err: any) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
  });

  // DELETE /:sourceId — delete source
  app.delete('/:sourceId', async (request, reply) => {
    const { projectId, sourceId } = request.params as { projectId: string; sourceId: string };

    try {
      const useCase = new DeleteSource(app.sourceRepository, app.projectRepository);
      await useCase.execute({ sourceId, projectId, userId: request.user!.id });
      return reply.status(204).send();
    } catch (err: any) {
      const isNotFound = err.message?.includes('not found');
      return reply.status(isNotFound ? 404 : 400).send({
        error: { code: isNotFound ? 'NOT_FOUND' : 'ERROR', message: err.message },
      });
    }
  });
};
