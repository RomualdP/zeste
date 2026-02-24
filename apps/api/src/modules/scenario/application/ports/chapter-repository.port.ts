import type { ChapterEntity } from '@zeste/domain';

export interface ChapterRepositoryPort {
  findById(id: string): Promise<ChapterEntity | null>;
  findByProjectId(projectId: string): Promise<ChapterEntity[]>;
  save(chapter: ChapterEntity): Promise<void>;
  saveAll(chapters: ChapterEntity[]): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByProjectId(projectId: string): Promise<void>;
}
