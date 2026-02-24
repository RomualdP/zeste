import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';

interface DeleteChapterInput {
  userId: string;
  projectId: string;
  chapterId: string;
}

export class DeleteChapter {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
  ) {}

  async execute(input: DeleteChapterInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const chapters = await this.chapterRepository.findByProjectId(input.projectId);

    const chapter = chapters.find((c) => c.id === input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    if (chapters.length <= 1) {
      throw new Error('Cannot delete: project must have at least one chapter');
    }

    await this.chapterRepository.delete(input.chapterId);
  }
}
