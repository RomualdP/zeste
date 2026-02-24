import type { UserRepositoryPort } from '../ports/user-repository.port';

interface RevenueCatWebhookEvent {
  event: {
    type: string;
    app_user_id: string;
    expiration_at_ms: number;
  };
}

const ACTIVATION_EVENTS = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
];

const DEACTIVATION_EVENTS = [
  'EXPIRATION',
  'CANCELLATION',
];

export class HandleSubscriptionWebhook {
  constructor(private readonly userRepository: UserRepositoryPort) {}

  async execute(payload: RevenueCatWebhookEvent): Promise<void> {
    const { type, app_user_id, expiration_at_ms } = payload.event;

    const user = await this.userRepository.findById(app_user_id);
    if (!user) {
      throw new Error('User not found');
    }

    if (ACTIVATION_EVENTS.includes(type)) {
      const expiresAt = new Date(expiration_at_ms).toISOString();
      const activated = user.activateSubscription(expiresAt);
      await this.userRepository.save(activated);
      return;
    }

    if (DEACTIVATION_EVENTS.includes(type)) {
      const deactivated = user.deactivateSubscription();
      await this.userRepository.save(deactivated);
      return;
    }
  }
}
