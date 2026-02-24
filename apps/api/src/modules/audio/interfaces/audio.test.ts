import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { audioRoutes } from './audio';
import { ProjectEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';
import type { AuthServicePort } from '../../identity/application/ports/auth-service.port';
import type { UserRepositoryPort } from '../../identity/application/ports/user-repository.port';
import type { ProjectRepositoryPort } from '../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../../scenario/application/ports/chapter-repository.port';
import type { TtsServicePort } from '../application/ports/tts-service.port';
import type { AudioStoragePort } from '../application/ports/audio-storage.port';

function createMocks() {
  const project = ProjectEntity.create('p1', 'user-1', 'Test')
    .configure(Tone.Debate, TargetDuration.Medium, 2)
    .startProcessing();

  const chapters = [
    ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0).setScript([
      { speaker: 'host', text: 'Hello', tone: 'enthusiastic' },
    ]),
    ChapterEntity.create('ch2', 'p1', 'Main', 'Details', 1).setScript([
      { speaker: 'expert', text: 'Hi', tone: 'friendly' },
    ]),
  ];

  return {
    authService: {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      verifyToken: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
      deleteUser: vi.fn(),
    } as AuthServicePort,

    userRepository: {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as UserRepositoryPort,

    projectRepository: {
      findById: vi.fn().mockResolvedValue(project),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    } as ProjectRepositoryPort,

    chapterRepository: {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(chapters),
      save: vi.fn(),
      saveAll: vi.fn(),
      delete: vi.fn(),
      deleteByProjectId: vi.fn(),
    } as ChapterRepositoryPort,

    ttsService: {
      synthesizeChapter: vi.fn().mockResolvedValue({
        audioBuffer: Buffer.from('fake'),
        durationMs: 30000,
      }),
    } as TtsServicePort,

    audioStorage: {
      upload: vi.fn().mockResolvedValue('audio/p1/ch.mp3'),
      getUrl: vi.fn(),
      delete: vi.fn(),
    } as AudioStoragePort,
  };
}

async function buildApp(mocks: ReturnType<typeof createMocks>) {
  const app = Fastify();
  app.decorate('authService', mocks.authService);
  app.decorate('userRepository', mocks.userRepository);
  app.decorate('projectRepository', mocks.projectRepository);
  app.decorate('chapterRepository', mocks.chapterRepository);
  app.decorate('ttsService', mocks.ttsService);
  app.decorate('audioStorage', mocks.audioStorage);
  app.register(audioRoutes, { prefix: '/api/projects/:id' });
  return app;
}

describe('POST /api/projects/:id/generate-audio', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it('should return 202 and start audio generation', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-audio',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(202);
    const body = response.json();
    expect(body.message).toBe('Audio generation started');
    await app.close();
  });

  it('should return 401 without auth', async () => {
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-audio',
    });

    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it('should return 400 when no chapters', async () => {
    vi.mocked(mocks.chapterRepository.findByProjectId).mockResolvedValue([]);
    const app = await buildApp(mocks);
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects/p1/generate-audio',
      headers: { authorization: 'Bearer valid-token' },
    });

    expect(response.statusCode).toBe(400);
    await app.close();
  });
});
