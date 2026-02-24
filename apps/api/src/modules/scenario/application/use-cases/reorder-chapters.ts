import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { ChapterEntity } from '@zeste/domain';
import type { UpdateChapterOrderDto } from '@zeste/shared';

interface ReorderChaptersInput {
  userId: string;
  projectId: string;
  order: UpdateChapterOrderDto[];
}

export class ReorderChapters {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
  ) {}

  async execute(input: ReorderChaptersInput): Promise<ChapterEntity[]> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const chapters = await this.chapterRepository.findByProjectId(input.projectId);
    const chapterMap = new Map(chapters.map((c) => [c.id, c]));

    const updated: ChapterEntity[] = [];
    for (const item of input.order) {
      const chapter = chapterMap.get(item.chapterId);
      if (!chapter) {
        throw new Error(`Chapter not found: ${item.chapterId}`);
      }
      updated.push(chapter.reposition(item.position));
    }

    await this.chapterRepository.saveAll(updated);

    return updated;
  }
}
