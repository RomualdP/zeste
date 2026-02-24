import type { SupabaseClient } from '@supabase/supabase-js';
import { SharedLinkEntity } from '@zeste/domain';
import type { SharedLinkRepositoryPort } from '../application/ports/shared-link-repository.port';

interface SharedLinkRow {
  id: string;
  project_id: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

export class SupabaseSharedLinkRepository implements SharedLinkRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<SharedLinkEntity | null> {
    const { data, error } = await this.client
      .from('shared_links')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as SharedLinkRow);
  }

  async findByProjectId(projectId: string): Promise<SharedLinkEntity | null> {
    const { data, error } = await this.client
      .from('shared_links')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as SharedLinkRow);
  }

  async findBySlug(slug: string): Promise<SharedLinkEntity | null> {
    const { data, error } = await this.client
      .from('shared_links')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as SharedLinkRow);
  }

  async save(link: SharedLinkEntity): Promise<void> {
    const { error } = await this.client.from('shared_links').upsert({
      id: link.id,
      project_id: link.projectId,
      slug: link.slug,
      is_active: link.isActive,
      created_at: link.createdAt,
    });

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('shared_links').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  private toDomain(row: SharedLinkRow): SharedLinkEntity {
    return new SharedLinkEntity(row.id, {
      projectId: row.project_id,
      slug: row.slug,
      isActive: row.is_active,
      createdAt: row.created_at,
    });
  }
}
