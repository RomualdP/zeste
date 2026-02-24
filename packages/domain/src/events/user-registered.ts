import type { DomainEvent } from '../base';

export interface UserRegistered extends DomainEvent {
  readonly eventName: 'UserRegistered';
  readonly email: string;
  readonly displayName: string;
}
