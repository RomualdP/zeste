import { createApp } from './create-app';
import { getSupabaseClient, getSupabaseServiceClient } from './shared/infrastructure/supabase-client';
import { SupabaseAuthService } from './modules/identity/infrastructure/supabase-auth-service';
import { SupabaseUserRepository } from './modules/identity/infrastructure/supabase-user-repository';
import { SupabaseProjectRepository } from './modules/project/infrastructure/supabase-project-repository';
import { SupabaseSourceRepository } from './modules/project/infrastructure/supabase-source-repository';
import { JinaIngestionService } from './modules/project/infrastructure/jina-ingestion-service';
import { SupabaseChapterRepository } from './modules/scenario/infrastructure/supabase-chapter-repository';
import { MistralLlmService } from './modules/scenario/infrastructure/mistral-llm-service';
import { FishAudioTtsService } from './modules/audio/infrastructure/fish-audio-tts-service';
import { SupabaseAudioStorage } from './modules/audio/infrastructure/supabase-audio-storage';
import { SupabaseSharedLinkRepository } from './modules/sharing/infrastructure/supabase-shared-link-repository';
import { SupabaseGenerationStatusRepository } from './modules/project/infrastructure/supabase-generation-status-repository';
import {
  buildRedisConnection,
  createGenerateFullQueue,
  startGenerateFullWorker,
} from './infrastructure/jobs/generate-full-queue';
import { GenerateFullWorker } from './infrastructure/jobs/generate-full-worker';
import { GenerateChapterPlan } from './modules/scenario/application/use-cases/generate-chapter-plan';
import { GenerateScenario } from './modules/scenario/application/use-cases/generate-scenario';
import { GenerateProjectAudio } from './modules/audio/application/use-cases/generate-project-audio';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const supabaseClient = getSupabaseClient();
  const supabaseServiceClient = getSupabaseServiceClient();

  const projectRepository = new SupabaseProjectRepository(supabaseServiceClient);
  const sourceRepository = new SupabaseSourceRepository(supabaseServiceClient);
  const chapterRepository = new SupabaseChapterRepository(supabaseServiceClient);
  const llmService = new MistralLlmService(process.env.MISTRAL_API_KEY!);
  const ttsService = new FishAudioTtsService(
    process.env.FISH_AUDIO_API_KEY!,
    process.env.FISH_AUDIO_HOST_VOICE_ID ?? '',
    process.env.FISH_AUDIO_EXPERT_VOICE_ID ?? '',
  );
  const audioStorage = new SupabaseAudioStorage(supabaseServiceClient);
  const generationStatusRepository = new SupabaseGenerationStatusRepository(
    supabaseServiceClient,
  );

  const redisConnection = buildRedisConnection();
  const generationQueue = createGenerateFullQueue(redisConnection);

  const generateFullWorker = new GenerateFullWorker(
    new GenerateChapterPlan(projectRepository, sourceRepository, chapterRepository, llmService),
    new GenerateScenario(projectRepository, sourceRepository, chapterRepository, llmService),
    new GenerateProjectAudio(projectRepository, chapterRepository, ttsService, audioStorage),
    generationStatusRepository,
  );
  const bullWorker = startGenerateFullWorker(generateFullWorker, redisConnection);

  const app = createApp({
    authService: new SupabaseAuthService(supabaseClient, supabaseServiceClient),
    userRepository: new SupabaseUserRepository(supabaseServiceClient),
    projectRepository,
    sourceRepository,
    ingestionService: new JinaIngestionService(process.env.JINA_API_KEY!),
    chapterRepository,
    llmService,
    ttsService,
    audioStorage,
    sharedLinkRepository: new SupabaseSharedLinkRepository(supabaseServiceClient),
    generationStatusRepository,
    generationQueue,
  });

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down...`);
      await bullWorker.close();
      await generationQueue.close();
      await app.close();
      process.exit(0);
    });
  }
}

start();
