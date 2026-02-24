import type { AudioStoragePort } from '../application/ports/audio-storage.port';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'audio';
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export class SupabaseAudioStorage implements AudioStoragePort {
  constructor(private readonly supabase: SupabaseClient) {}

  async upload(projectId: string, chapterId: string, audioBuffer: Buffer): Promise<string> {
    const path = `${projectId}/${chapterId}.mp3`;

    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .upload(path, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (error) throw new Error(error.message);
    return data.path;
  }

  async getUrl(audioPath: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(audioPath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) throw new Error(error.message);
    return data.signedUrl;
  }

  async delete(audioPath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .remove([audioPath]);

    if (error) throw new Error(error.message);
  }
}
