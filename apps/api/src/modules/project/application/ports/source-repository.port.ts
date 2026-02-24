import type { SourceEntity } from '@zeste/domain';

export interface SourceRepositoryPort {
  findById(id: string): Promise<SourceEntity | null>;
  findByProjectId(projectId: string): Promise<SourceEntity[]>;
  save(source: SourceEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
