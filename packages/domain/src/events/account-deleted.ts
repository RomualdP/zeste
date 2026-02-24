import type { DomainEvent } from '../base';

export interface AccountDeleted extends DomainEvent {
  readonly eventName: 'AccountDeleted';
  readonly email: string;
}
