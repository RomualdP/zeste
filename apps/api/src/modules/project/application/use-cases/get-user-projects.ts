import type { ProjectEntity } from '@zeste/domain';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';

interface GetUserProjectsInput {
  userId: string;
}

export class GetUserProjects {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(input: GetUserProjectsInput): Promise<ProjectEntity[]> {
    return this.projectRepository.findByUserId(input.userId);
  }
}
