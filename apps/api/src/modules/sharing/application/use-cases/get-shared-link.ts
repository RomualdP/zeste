import type { SharedLinkRepositoryPort } from '../ports/shared-link-repository.port';
import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../../../scenario/application/ports/chapter-repository.port';
import type { ProjectEntity, ChapterEntity } from '@zeste/domain';

interface GetSharedLinkInput {
  slug: string;
}

interface GetSharedLinkResult {
  project: ProjectEntity;
  chapters: ChapterEntity[];
}

export class GetSharedLink {
  constructor(
    private readonly sharedLinkRepository: SharedLinkRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
  ) {}

  async execute(input: GetSharedLinkInput): Promise<GetSharedLinkResult> {
    const link = await this.sharedLinkRepository.findBySlug(input.slug);
    if (!link) {
      throw new Error('Shared link not found');
    }

    if (!link.isActive) {
      throw new Error('Shared link is no longer active');
    }

    const project = await this.projectRepository.findById(link.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const chapters = await this.chapterRepository.findByProjectId(link.projectId);
    const sortedChapters = [...chapters].sort((a, b) => a.position - b.position);

    return { project, chapters: sortedChapters };
  }
}
