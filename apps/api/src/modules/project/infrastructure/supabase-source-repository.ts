import type { SupabaseClient } from '@supabase/supabase-js';
import { SourceEntity } from '@zeste/domain';
import type { SourceType, SourceStatus } from '@zeste/shared';
import type { SourceRepositoryPort } from '../application/ports/source-repository.port';

interface SourceRow {
  id: string;
  project_id: string;
  type: string;
  url: string | null;
  file_path: string | null;
  raw_content: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

export class SupabaseSourceRepository implements SourceRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<SourceEntity | null> {
    const { data, error } = await this.client
      .from('sources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as SourceRow);
  }

  async findByProjectId(projectId: string): Promise<SourceEntity[]> {
    const { data, error } = await this.client
      .from('sources')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return (data as SourceRow[]).map((row) => this.toDomain(row));
  }

  async save(source: SourceEntity): Promise<void> {
    const { error } = await this.client.from('sources').upsert({
      id: source.id,
      project_id: source.projectId,
      type: source.type,
      url: source.url,
      file_path: source.filePath,
      raw_content: source.rawContent,
      status: source.status,
      error_message: source.errorMessage,
      created_at: source.createdAt,
    });

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('sources').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  private toDomain(row: SourceRow): SourceEntity {
    return new SourceEntity(row.id, {
      projectId: row.project_id,
      type: row.type as SourceType,
      url: row.url,
      filePath: row.file_path,
      rawContent: row.raw_content,
      status: row.status as SourceStatus,
      errorMessage: row.error_message,
      createdAt: row.created_at,
    });
  }
}
