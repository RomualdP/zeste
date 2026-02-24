import type { DomainEvent } from '../base';
import type { SourceType } from '@zeste/shared';

export interface SourceIngested extends DomainEvent {
  readonly eventName: 'SourceIngested';
  readonly sourceId: string;
  readonly sourceType: SourceType;
  readonly wordCount: number;
}
