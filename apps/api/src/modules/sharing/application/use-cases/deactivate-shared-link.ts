import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SharedLinkRepositoryPort } from '../ports/shared-link-repository.port';

interface DeactivateSharedLinkInput {
  userId: string;
  projectId: string;
}

export class DeactivateSharedLink {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly sharedLinkRepository: SharedLinkRepositoryPort,
  ) {}

  async execute(input: DeactivateSharedLinkInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const link = await this.sharedLinkRepository.findByProjectId(input.projectId);
    if (!link) {
      throw new Error('No shared link found');
    }

    const deactivated = link.deactivate();
    await this.sharedLinkRepository.save(deactivated);
  }
}
