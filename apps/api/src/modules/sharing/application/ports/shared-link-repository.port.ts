import type { SharedLinkEntity } from '@zeste/domain';

export interface SharedLinkRepositoryPort {
  findById(id: string): Promise<SharedLinkEntity | null>;
  findByProjectId(projectId: string): Promise<SharedLinkEntity | null>;
  findBySlug(slug: string): Promise<SharedLinkEntity | null>;
  save(link: SharedLinkEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
