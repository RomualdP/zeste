import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HandleSubscriptionWebhook } from './handle-subscription-webhook';
import { UserEntity } from '@zeste/domain';

describe('HandleSubscriptionWebhook', () => {
  const mockUserRepo = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  let useCase: HandleSubscriptionWebhook;
  const user = UserEntity.create('user-1', 'test@example.com', 'Jean');

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new HandleSubscriptionWebhook(mockUserRepo);
  });

  it('should activate subscription on INITIAL_PURCHASE', async () => {
    mockUserRepo.findById.mockResolvedValue(user);

    await useCase.execute({
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        expiration_at_ms: 1711238400000,
      },
    });

    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionActive: true,
        subscriptionExpiresAt: expect.any(String),
      }),
    );
  });

  it('should activate subscription on RENEWAL', async () => {
    mockUserRepo.findById.mockResolvedValue(user);

    await useCase.execute({
      event: {
        type: 'RENEWAL',
        app_user_id: 'user-1',
        expiration_at_ms: 1711238400000,
      },
    });

    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionActive: true }),
    );
  });

  it('should deactivate subscription on EXPIRATION', async () => {
    const activeUser = user.activateSubscription('2026-03-24T00:00:00.000Z');
    mockUserRepo.findById.mockResolvedValue(activeUser);

    await useCase.execute({
      event: {
        type: 'EXPIRATION',
        app_user_id: 'user-1',
        expiration_at_ms: 0,
      },
    });

    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionActive: false }),
    );
  });

  it('should deactivate subscription on CANCELLATION', async () => {
    const activeUser = user.activateSubscription('2026-03-24T00:00:00.000Z');
    mockUserRepo.findById.mockResolvedValue(activeUser);

    await useCase.execute({
      event: {
        type: 'CANCELLATION',
        app_user_id: 'user-1',
        expiration_at_ms: 0,
      },
    });

    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ subscriptionActive: false }),
    );
  });

  it('should throw when user not found', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: 'unknown',
          expiration_at_ms: 0,
        },
      }),
    ).rejects.toThrow('User not found');
  });

  it('should ignore unknown event types', async () => {
    mockUserRepo.findById.mockResolvedValue(user);

    await useCase.execute({
      event: {
        type: 'PRODUCT_CHANGE',
        app_user_id: 'user-1',
        expiration_at_ms: 0,
      },
    });

    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });
});
