import type { ProjectRepositoryPort } from '../ports/project-repository.port';

interface DeleteProjectInput {
  projectId: string;
  userId: string;
}

export class DeleteProject {
  constructor(private readonly projectRepository: ProjectRepositoryPort) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    await this.projectRepository.delete(input.projectId);
  }
}
