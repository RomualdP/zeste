import type { ProjectEntity } from '@zeste/domain';

export interface ProjectRepositoryPort {
  findById(id: string): Promise<ProjectEntity | null>;
  findByUserId(userId: string): Promise<ProjectEntity[]>;
  save(project: ProjectEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
