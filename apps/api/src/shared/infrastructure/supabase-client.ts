import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let serviceClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publishableKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY environment variables');
    }
    client = createClient(url, publishableKey);
  }
  return client;
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secretKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY environment variables');
    }
    serviceClient = createClient(url, secretKey);
  }
  return serviceClient;
}
