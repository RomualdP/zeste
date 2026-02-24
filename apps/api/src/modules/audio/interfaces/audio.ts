import type { FastifyPluginAsync } from 'fastify';
import { GenerateProjectAudio } from '../application/use-cases/generate-project-audio';
import type { TtsServicePort } from '../application/ports/tts-service.port';
import type { AudioStoragePort } from '../application/ports/audio-storage.port';
import { requireAuth } from '../../../shared/middlewares/require-auth';

declare module 'fastify' {
  interface FastifyInstance {
    ttsService: TtsServicePort;
    audioStorage: AudioStoragePort;
  }
}

export const audioRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireAuth);

  // POST /generate-audio — start audio generation for all chapters
  app.post('/generate-audio', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const useCase = new GenerateProjectAudio(
        app.projectRepository,
        app.chapterRepository,
        app.ttsService,
        app.audioStorage,
      );
      await useCase.execute({
        userId: request.user!.id,
        projectId: id,
      });

      return reply.status(202).send({ message: 'Audio generation started' });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'GENERATION_ERROR', message: err.message },
      });
    }
  });

  // GET /chapters/:chapterId/audio — get signed URL for chapter audio
  app.get('/chapters/:chapterId/audio', async (request, reply) => {
    const { id, chapterId } = request.params as { id: string; chapterId: string };

    try {
      const project = await app.projectRepository.findById(id);
      if (!project || project.userId !== request.user!.id) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Project not found' },
        });
      }

      const chapters = await app.chapterRepository.findByProjectId(id);
      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter || !chapter.audioPath) {
        return reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Audio not found' },
        });
      }

      const signedUrl = await app.audioStorage.getUrl(chapter.audioPath);
      return reply.status(200).send({ data: { url: signedUrl } });
    } catch (err: any) {
      return reply.status(400).send({
        error: { code: 'AUDIO_ERROR', message: err.message },
      });
    }
  });
};
