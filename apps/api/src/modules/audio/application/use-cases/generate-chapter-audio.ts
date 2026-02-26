import type { ChapterRepositoryPort } from '../../../scenario/application/ports/chapter-repository.port';
import type { TtsServicePort } from '../ports/tts-service.port';
import type { AudioStoragePort } from '../ports/audio-storage.port';
import type { ChapterEntity } from '@zeste/domain';

interface GenerateChapterAudioInput {
  chapterId: string;
}

export class GenerateChapterAudio {
  constructor(
    private readonly chapterRepository: ChapterRepositoryPort,
    private readonly ttsService: TtsServicePort,
    private readonly audioStorage: AudioStoragePort,
  ) {}

  async execute(input: GenerateChapterAudioInput): Promise<ChapterEntity> {
    const chapter = await this.chapterRepository.findById(input.chapterId);
    if (!chapter) {
      throw new Error('Chapter not found');
    }

    if (chapter.script.length === 0) {
      throw new Error('Chapter has no script');
    }

    const generatingChapter = chapter.startGenerating();

    try {
      const segments = chapter.script.map((entry) => ({
        speaker: entry.speaker,
        text: entry.text,
        emotion: entry.tone,
      }));

      const ttsResult = await this.ttsService.synthesizeChapter(segments);

      const audioPath = await this.audioStorage.upload(
        chapter.projectId,
        chapter.id,
        ttsResult.audioBuffer,
      );

      const readyChapter = generatingChapter.markReady(audioPath, ttsResult.durationMs);
      await this.chapterRepository.save(readyChapter);

      return readyChapter;
    } catch (err) {
      const errorChapter = generatingChapter.markError();
      await this.chapterRepository.save(errorChapter);
      throw err;
    }
  }
}
