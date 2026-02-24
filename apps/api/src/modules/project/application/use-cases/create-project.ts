import { ProjectEntity, ProjectName } from '@zeste/domain';
import { randomUUID } from 'crypto';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';

interface CreateProjectInput {
  userId: string;
  name: string;
}

export class CreateProject {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(input: CreateProjectInput): Promise<ProjectEntity> {
    // Validate name via VO
    new ProjectName(input.name);

    const project = ProjectEntity.create(randomUUID(), input.userId, input.name);
    await this.projectRepository.save(project);

    return project;
  }
}
