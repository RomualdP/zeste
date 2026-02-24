import type { Tone, TargetDuration } from '../enums';

export interface ConfigurePodcastDto {
  projectId: string;
  tone: Tone;
  targetDuration: TargetDuration;
  chapterCount: number;
}
