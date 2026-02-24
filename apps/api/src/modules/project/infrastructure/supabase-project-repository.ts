import type { SupabaseClient } from '@supabase/supabase-js';
import { ProjectEntity } from '@zeste/domain';
import type { Tone, TargetDuration, ProjectStatus } from '@zeste/shared';
import type { ProjectRepositoryPort } from '../application/ports/project-repository.port';

interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  tone: string;
  target_duration: number;
  chapter_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export class SupabaseProjectRepository implements ProjectRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<ProjectEntity | null> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as ProjectRow);
  }

  async findByUserId(userId: string): Promise<ProjectEntity[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as ProjectRow[]).map((row) => this.toDomain(row));
  }

  async save(project: ProjectEntity): Promise<void> {
    const { error } = await this.client.from('projects').upsert({
      id: project.id,
      user_id: project.userId,
      name: project.name,
      tone: project.tone,
      target_duration: project.targetDuration,
      chapter_count: project.chapterCount,
      status: project.status,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    });

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('projects').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  private toDomain(row: ProjectRow): ProjectEntity {
    return new ProjectEntity(row.id, {
      userId: row.user_id,
      name: row.name,
      tone: row.tone as Tone,
      targetDuration: row.target_duration as TargetDuration,
      chapterCount: row.chapter_count,
      status: row.status as ProjectStatus,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
