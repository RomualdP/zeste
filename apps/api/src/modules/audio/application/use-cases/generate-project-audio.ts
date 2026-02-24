import type { ProjectRepositoryPort } from '../../../project/application/ports/project-repository.port';
import type { ChapterRepositoryPort } from '../../../scenario/application/ports/chapter-repository.port';
import type { TtsServicePort } from '../ports/tts-service.port';
import type { AudioStoragePort } from '../ports/audio-storage.port';

interface GenerateProjectAudioInput {
  userId: string;
  projectId: string;
}

export class GenerateProjectAudio {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly chapterRepository: ChapterRepositoryPort,
    private readonly ttsService: TtsServicePort,
    private readonly audioStorage: AudioStoragePort,
  ) {}

  async execute(input: GenerateProjectAudioInput): Promise<void> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const chapters = await this.chapterRepository.findByProjectId(input.projectId);
    if (chapters.length === 0) {
      throw new Error('No chapters found');
    }

    const sortedChapters = [...chapters].sort((a, b) => a.position - b.position);

    try {
      for (const chapter of sortedChapters) {
        const segments = chapter.script.map((entry) => ({
          speaker: entry.speaker,
          text: entry.text,
        }));

        const ttsResult = await this.ttsService.synthesizeChapter(segments);

        const audioPath = await this.audioStorage.upload(
          input.projectId,
          chapter.id,
          ttsResult.audioBuffer,
        );

        const generatingChapter = chapter.startGenerating();
        const readyChapter = generatingChapter.markReady(audioPath, ttsResult.durationMs);
        await this.chapterRepository.save(readyChapter);
      }

      const readyProject = project.markReady();
      await this.projectRepository.save(readyProject);
    } catch (err) {
      const errorProject = project.markError();
      await this.projectRepository.save(errorProject);
      throw err;
    }
  }
}
