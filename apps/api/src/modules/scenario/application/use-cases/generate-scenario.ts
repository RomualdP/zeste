import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../../project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { LlmServicePort } from '../ports/llm-service.port';
import { SourceStatus, AUDIO } from '@zeste/shared';
import type { ChapterEntity } from '@zeste/domain';

interface GenerateScenarioInput {
  userId: string;
  projectId: string;
}

export class GenerateScenario {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly sourceRepository: SourceRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
    private readonly llmService: LlmServicePort,
  ) {}

  async execute(input: GenerateScenarioInput): Promise<ChapterEntity[]> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const chapters = await this.chapterRepository.findByProjectId(input.projectId);
    if (chapters.length === 0) {
      throw new Error('No chapters found. Generate a chapter plan first.');
    }

    // Set project to processing
    const processingProject = project.startProcessing();
    await this.projectRepository.save(processingProject);

    // Get sources for context
    const sources = await this.sourceRepository.findByProjectId(input.projectId);
    const sourceContents = sources
      .filter((s) => s.status === SourceStatus.Ingested)
      .map((s) => s.rawContent);

    const totalWords = AUDIO.TARGET_WORDS[project.targetDuration];
    const wordsPerChapter = Math.round(totalWords / chapters.length);

    // Sort chapters by position
    const sortedChapters = [...chapters].sort((a, b) => a.position - b.position);

    // Generate scripts sequentially (each chapter uses previous context)
    const updatedChapters: ChapterEntity[] = [];
    for (let i = 0; i < sortedChapters.length; i++) {
      const chapter = sortedChapters[i]!;
      const previousChaptersContext = sortedChapters.slice(0, i).map((c) => c.title);

      const script = await this.llmService.generateChapterScript({
        chapterTitle: chapter.title,
        chapterSummary: chapter.summary,
        sources: sourceContents,
        tone: project.tone,
        targetWordCount: wordsPerChapter,
        previousChaptersContext,
      });

      const updated = chapter.setScript(script);
      await this.chapterRepository.save(updated);
      updatedChapters.push(updated);
    }

    return updatedChapters;
  }
}
