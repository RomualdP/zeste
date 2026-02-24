import type { FastifyPluginAsync } from 'fastify';
import { CreateProject } from '../application/use-cases/create-project';
import { GetUserProjects } from '../application/use-cases/get-user-projects';
import { GetProject } from '../application/use-cases/get-project';
import type { ProjectRepositoryPort } from '../application/ports/project-repository.port';
import { requireAuth } from '../../../shared/middlewares/require-auth';

declare module 'fastify' {
  interface FastifyInstance {
    projectRepository: ProjectRepositoryPort;
  }
}

function serializeProject(project: { id: string; userId: string; name: string; tone: string; targetDuration: number; chapterCount: number; status: string; createdAt: string; updatedAt: string }) {
  return {
    id: project.id,
    userId: project.userId,
    name: project.name,
    tone: project.tone,
    targetDuration: project.targetDuration,
    chapterCount: project.chapterCount,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export const projectRoutes: FastifyPluginAsync = async (app) => {
  // All routes require auth
  app.addHook('preHandler', requireAuth);

  // POST / — create project
  app.post('/', async (request, reply) => {
    const { name } = request.body as { name?: string };

    if (!name) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'name is required' },
      });
    }

    try {
      const useCase = new CreateProject(app.projectRepository);
      const project = await useCase.execute({ userId: request.user!.id, name });
      return reply.status(201).send({ data: serializeProject(project) });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: err.message },
      });
    }
  });

  // GET / — list user projects
  app.get('/', async (request, reply) => {
    const useCase = new GetUserProjects(app.projectRepository);
    const projects = await useCase.execute({ userId: request.user!.id });
    return reply.status(200).send({ data: projects.map(serializeProject) });
  });

  // GET /:id — get project detail
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new GetProject(app.projectRepository);
      const project = await useCase.execute({ projectId: id, userId: request.user!.id });
      return reply.status(200).send({ data: serializeProject(project) });
    } catch (err: any) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: err.message },
      });
    }
  });
};
