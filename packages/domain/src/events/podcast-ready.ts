import type { DomainEvent } from '../base';

export interface PodcastReady extends DomainEvent {
  readonly eventName: 'PodcastReady';
  readonly totalDurationSeconds: number;
  readonly chapterCount: number;
}
