import type { DomainEvent } from '../base';

export interface ScenarioGenerated extends DomainEvent {
  readonly eventName: 'ScenarioGenerated';
  readonly chapterId: string;
  readonly wordCount: number;
}
