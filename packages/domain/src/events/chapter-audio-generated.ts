import type { DomainEvent } from '../base';

export interface ChapterAudioGenerated extends DomainEvent {
  readonly eventName: 'ChapterAudioGenerated';
  readonly chapterId: string;
  readonly durationSeconds: number;
  readonly audioPath: string;
}
