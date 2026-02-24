import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../../project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { LlmServicePort } from '../ports/llm-service.port';
import { SourceStatus } from '@zeste/shared';
import { ChapterEntity } from '@zeste/domain';

interface GenerateChapterPlanInput {
  userId: string;
  projectId: string;
}

export class GenerateChapterPlan {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly sourceRepository: SourceRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
    private readonly llmService: LlmServicePort,
  ) {}

  async execute(input: GenerateChapterPlanInput): Promise<ChapterEntity[]> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const sources = await this.sourceRepository.findByProjectId(input.projectId);
    const ingestedSources = sources.filter((s) => s.status === SourceStatus.Ingested);
    if (ingestedSources.length === 0) {
      throw new Error('Project must have at least one ingested source');
    }

    // Delete existing chapters before regenerating
    await this.chapterRepository.deleteByProjectId(input.projectId);

    const planItems = await this.llmService.generateChapterPlan({
      sources: ingestedSources.map((s) => s.rawContent),
      tone: project.tone,
      chapterCount: project.chapterCount,
    });

    const chapters = planItems.map((item, index) =>
      ChapterEntity.create(
        `${input.projectId}-ch-${index}`,
        input.projectId,
        item.title,
        item.summary,
        index,
      ),
    );

    await this.chapterRepository.saveAll(chapters);

    return chapters;
  }
}
