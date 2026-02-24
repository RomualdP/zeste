import type { ProjectEntity } from '@zeste/domain';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';

interface GetProjectInput {
  projectId: string;
  userId: string;
}

export class GetProject {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(input: GetProjectInput): Promise<ProjectEntity> {
    const project = await this.projectRepository.findById(input.projectId);

    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    return project;
  }
}
