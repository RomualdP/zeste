export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: string;
  readonly aggregateId: string;
}
