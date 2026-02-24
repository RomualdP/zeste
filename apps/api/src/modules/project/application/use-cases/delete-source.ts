import type { SourceRepositoryPort } from '../ports/source-repository.port';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';

interface DeleteSourceInput {
  sourceId: string;
  projectId: string;
  userId: string;
}

export class DeleteSource {
  constructor(
    private readonly sourceRepository: SourceRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
  ) {}

  async execute(input: DeleteSourceInput): Promise<void> {
    // Verify project ownership
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    // Verify source exists and belongs to the project
    const source = await this.sourceRepository.findById(input.sourceId);
    if (!source || source.projectId !== input.projectId) {
      throw new Error('Source not found');
    }

    await this.sourceRepository.delete(input.sourceId);
  }
}
