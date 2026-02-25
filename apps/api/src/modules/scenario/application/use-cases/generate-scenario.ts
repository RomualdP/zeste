import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../../project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../ports/chapter-repository.port';
import type { LlmServicePort } from '../ports/llm-service.port';
import { SourceStatus, targetWords } from '@zeste/shared';
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

    const totalWords = targetWords(project.targetDuration);
    const wordsPerChapter = Math.round(totalWords / chapters.length);
    console.log('[SCENARIO] Target:', { targetDuration: project.targetDuration, totalWords, chapters: chapters.length, wordsPerChapter });

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

      const wordCount = script.reduce((sum, entry) => sum + entry.text.split(/\s+/).length, 0);
      console.log(`[SCENARIO] Chapter "${chapter.title}": ${script.length} entries, ${wordCount} words (target: ${wordsPerChapter})`);

      const updated = chapter.setScript(script);
      await this.chapterRepository.save(updated);
      updatedChapters.push(updated);
    }

    const totalActualWords = updatedChapters.reduce((sum, ch) =>
      sum + ch.script.reduce((s, e) => s + e.text.split(/\s+/).length, 0), 0);
    const estimatedMinutes = Math.round(totalActualWords / 120);
    console.log(`[SCENARIO] Done: ${totalActualWords} words total (target: ${totalWords}), estimated ~${estimatedMinutes} min`);

    return updatedChapters;
  }
}
