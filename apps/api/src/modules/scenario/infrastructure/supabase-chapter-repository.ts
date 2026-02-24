import type { SupabaseClient } from '@supabase/supabase-js';
import { ChapterEntity } from '@zeste/domain';
import type { ChapterStatus, ScriptEntry } from '@zeste/shared';
import type { ChapterRepositoryPort } from '../application/ports/chapter-repository.port';

interface ChapterRow {
  id: string;
  project_id: string;
  title: string;
  summary: string;
  position: number;
  script: ScriptEntry[];
  audio_path: string | null;
  audio_duration: number | null;
  status: string;
  created_at: string;
}

export class SupabaseChapterRepository implements ChapterRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<ChapterEntity | null> {
    const { data, error } = await this.client
      .from('chapters')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as ChapterRow);
  }

  async findByProjectId(projectId: string): Promise<ChapterEntity[]> {
    const { data, error } = await this.client
      .from('chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('position', { ascending: true });

    if (error || !data) return [];
    return (data as ChapterRow[]).map((row) => this.toDomain(row));
  }

  async save(chapter: ChapterEntity): Promise<void> {
    const { error } = await this.client.from('chapters').upsert(this.toRow(chapter));
    if (error) throw new Error(error.message);
  }

  async saveAll(chapters: ChapterEntity[]): Promise<void> {
    const { error } = await this.client.from('chapters').upsert(chapters.map((c) => this.toRow(c)));
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('chapters').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async deleteByProjectId(projectId: string): Promise<void> {
    const { error } = await this.client.from('chapters').delete().eq('project_id', projectId);
    if (error) throw new Error(error.message);
  }

  private toRow(chapter: ChapterEntity) {
    return {
      id: chapter.id,
      project_id: chapter.projectId,
      title: chapter.title,
      summary: chapter.summary,
      position: chapter.position,
      script: chapter.script,
      audio_path: chapter.audioPath,
      audio_duration: chapter.audioDuration,
      status: chapter.status,
      created_at: chapter.createdAt,
    };
  }

  private toDomain(row: ChapterRow): ChapterEntity {
    return new ChapterEntity(row.id, {
      projectId: row.project_id,
      title: row.title,
      summary: row.summary,
      position: row.position,
      script: row.script ?? [],
      audioPath: row.audio_path,
      audioDuration: row.audio_duration,
      status: row.status as ChapterStatus,
      createdAt: row.created_at,
    });
  }
}
