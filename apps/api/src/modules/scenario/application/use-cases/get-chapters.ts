import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { ChapterEntity } from '@zeste/domain';

interface GetChaptersInput {
  userId: string;
  projectId: string;
}

export class GetChapters {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
  ) {}

  async execute(input: GetChaptersInput): Promise<ChapterEntity[]> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const chapters = await this.chapterRepository.findByProjectId(input.projectId);
    return [...chapters].sort((a, b) => a.position - b.position);
  }
}
