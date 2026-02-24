import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SharedLinkRepositoryPort } from '../ports/shared-link-repository.port';
import { SharedLinkEntity } from '@zeste/domain';
import { ProjectStatus } from '@zeste/shared';
import { randomBytes } from 'crypto';

interface CreateSharedLinkInput {
  userId: string;
  projectId: string;
}

export class CreateSharedLink {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly sharedLinkRepository: SharedLinkRepositoryPort,
  ) {}

  async execute(input: CreateSharedLinkInput): Promise<SharedLinkEntity> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    if (project.status !== ProjectStatus.Ready) {
      throw new Error('Project must be ready to share');
    }

    // Return existing active link if one exists
    const existing = await this.sharedLinkRepository.findByProjectId(input.projectId);
    if (existing && existing.isActive) {
      return existing;
    }

    const slug = randomBytes(6).toString('base64url');
    const id = `sl-${randomBytes(8).toString('hex')}`;
    const link = SharedLinkEntity.create(id, input.projectId, slug);

    await this.sharedLinkRepository.save(link);

    return link;
  }
}
