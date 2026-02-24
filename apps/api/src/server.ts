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

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const supabaseClient = getSupabaseClient();
  const supabaseServiceClient = getSupabaseServiceClient();

  const app = createApp({
    authService: new SupabaseAuthService(supabaseClient, supabaseServiceClient),
    userRepository: new SupabaseUserRepository(supabaseServiceClient),
    projectRepository: new SupabaseProjectRepository(supabaseServiceClient),
    sourceRepository: new SupabaseSourceRepository(supabaseServiceClient),
    ingestionService: new JinaIngestionService(process.env.JINA_API_KEY!),
    chapterRepository: new SupabaseChapterRepository(supabaseServiceClient),
    llmService: new MistralLlmService(process.env.MISTRAL_API_KEY!),
    ttsService: new FishAudioTtsService(
      process.env.FISH_AUDIO_API_KEY!,
      process.env.FISH_AUDIO_HOST_VOICE_ID ?? '',
      process.env.FISH_AUDIO_EXPERT_VOICE_ID ?? '',
    ),
    audioStorage: new SupabaseAudioStorage(supabaseServiceClient),
    sharedLinkRepository: new SupabaseSharedLinkRepository(supabaseServiceClient),
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
      await app.close();
      process.exit(0);
    });
  }
}

start();
