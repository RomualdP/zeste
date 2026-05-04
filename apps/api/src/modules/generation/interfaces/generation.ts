import type { FastifyPluginAsync } from 'fastify';
import { GenerationPhase } from '@zeste/shared';
import { requireAuth } from '../../../shared/middlewares/require-auth';
import { QuotaService } from '../../../shared/services/quota';
import type { GenerationStatusRepositoryPort } from '../../project/application/ports/generation-status-repository.port';
import type { GenerateFullJobPayload } from '../../../infrastructure/jobs/generate-full-worker';

export interface GenerateFullQueuePort {
  add(name: string, payload: GenerateFullJobPayload): Promise<{ id?: string }>;
}

declare module 'fastify' {
  interface FastifyInstance {
    generationStatusRepository: GenerationStatusRepositoryPort;
    generationQueue: GenerateFullQueuePort;
  }
}

export const generationRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  app.post('/generate-full', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const project = await app.projectRepository.findById(id);
    if (!project || project.userId !== userId) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
    }

    try {
      QuotaService.checkDurationQuota(project.targetDuration);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Quota exceeded';
      return reply.status(400).send({
        error: { code: 'QUOTA_EXCEEDED', message },
      });
    }

    const job = await app.generationQueue.add('generate-full', {
      userId,
      projectId: id,
    });

    await app.generationStatusRepository.updatePhase(id, GenerationPhase.Plan, 0);

    return reply.status(202).send({ data: { jobId: job.id } });
  });

  app.get('/generation-status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const project = await app.projectRepository.findById(id);
    if (!project || project.userId !== userId) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Project not found' },
      });
    }

    const status = await app.generationStatusRepository.getStatus(id);
    if (!status) {
      return reply.status(200).send({
        data: { phase: GenerationPhase.Idle, progress: 0, error: null },
      });
    }

    return reply.status(200).send({
      data: {
        phase: status.phase,
        progress: status.progress,
        error: status.error ?? null,
      },
    });
  });
};
