import type { DomainEvent } from '../base';

export interface ProjectCreated extends DomainEvent {
  readonly eventName: 'ProjectCreated';
  readonly projectName: string;
  readonly userId: string;
}
