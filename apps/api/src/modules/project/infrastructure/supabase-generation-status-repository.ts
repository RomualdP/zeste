import type { SupabaseClient } from '@supabase/supabase-js';
import { GenerationPhase } from '@zeste/shared';
import type {
  GenerationStatus,
  GenerationStatusRepositoryPort,
} from '../application/ports/generation-status-repository.port';

interface GenerationStatusRow {
  generation_phase: string;
  generation_progress: number | string;
  generation_error: string | null;
}

export class SupabaseGenerationStatusRepository implements GenerationStatusRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async getStatus(projectId: string): Promise<GenerationStatus | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('generation_phase, generation_progress, generation_error')
      .eq('id', projectId)
      .single();

    if (error || !data) return null;
    const row = data as GenerationStatusRow;
    return {
      phase: row.generation_phase as GenerationPhase,
      progress: Number(row.generation_progress),
      error: row.generation_error,
    };
  }

  async updatePhase(
    projectId: string,
    phase: GenerationPhase,
    progress: number,
  ): Promise<void> {
    const { error } = await this.client
      .from('projects')
      .update({
        generation_phase: phase,
        generation_progress: progress,
        generation_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw new Error(error.message);
  }

  async setError(projectId: string, message: string): Promise<void> {
    const { error } = await this.client
      .from('projects')
      .update({
        generation_phase: GenerationPhase.Error,
        generation_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw new Error(error.message);
  }
}
