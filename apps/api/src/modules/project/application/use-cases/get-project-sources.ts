import type { SourceEntity } from '@zeste/domain';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';

interface GetProjectSourcesInput {
  projectId: string;
  userId: string;
}

export class GetProjectSources {
  constructor(
    private readonly sourceRepository: SourceRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
  ) {}

  async execute(input: GetProjectSourcesInput): Promise<SourceEntity[]> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    return this.sourceRepository.findByProjectId(input.projectId);
  }
}
