import { createApp } from './create-app';
import { getSupabaseClient, getSupabaseServiceClient } from './shared/infrastructure/supabase-client';
import { SupabaseAuthService } from './modules/identity/infrastructure/supabase-auth-service';
import { SupabaseUserRepository } from './modules/identity/infrastructure/supabase-user-repository';
import { SupabaseProjectRepository } from './modules/project/infrastructure/supabase-project-repository';
import { SupabaseSourceRepository } from './modules/project/infrastructure/supabase-source-repository';

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
  });

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
