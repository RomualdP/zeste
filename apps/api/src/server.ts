import { createApp } from './create-app';
import { getSupabaseClient, getSupabaseServiceClient } from './infrastructure/supabase/supabase-client';
import { SupabaseAuthService } from './infrastructure/supabase/supabase-auth-service';
import { SupabaseUserRepository } from './infrastructure/supabase/supabase-user-repository';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const supabaseClient = getSupabaseClient();
  const supabaseServiceClient = getSupabaseServiceClient();

  const app = createApp({
    authService: new SupabaseAuthService(supabaseClient, supabaseServiceClient),
    userRepository: new SupabaseUserRepository(supabaseClient),
  });

  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
