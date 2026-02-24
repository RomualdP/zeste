import { createApp } from './create-app';
import { getSupabaseClient, getSupabaseServiceClient } from './shared/infrastructure/supabase-client';
import { SupabaseAuthService } from './modules/identity/infrastructure/supabase-auth-service';
import { SupabaseUserRepository } from './modules/identity/infrastructure/supabase-user-repository';
import { SupabaseProjectRepository } from './modules/project/infrastructure/supabase-project-repository';
import { SupabaseSourceRepository } from './modules/project/infrastructure/supabase-source-repository';
import { SupabaseChapterRepository } from './modules/scenario/infrastructure/supabase-chapter-repository';
import { SupabaseSharedLinkRepository } from './modules/sharing/infrastructure/supabase-shared-link-repository';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const supabaseClient = getSupabaseClient();
  const supabaseServiceClient = getSupabaseServiceClient();

  const app = createApp({
    authService: new SupabaseAuthService(supabaseClient, supabaseServiceClient),
    userRepository: new SupabaseUserRepository(supabaseClient),
    projectRepository: new SupabaseProjectRepository(supabaseClient),
    sourceRepository: new SupabaseSourceRepository(supabaseClient),
    chapterRepository: new SupabaseChapterRepository(supabaseClient),
    sharedLinkRepository: new SupabaseSharedLinkRepository(supabaseClient),
    // ingestionService: requires Jina/Pixtral API keys
    // llmService: requires Mistral API key
    // ttsService: requires Fish Audio API key
    // audioStorage: requires Supabase Storage bucket config
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
