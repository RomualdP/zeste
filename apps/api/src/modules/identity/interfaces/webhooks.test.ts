import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../../../create-app';
import { UserEntity } from '@zeste/domain';
import type { FastifyInstance } from 'fastify';

describe('Webhook Routes', () => {
  let app: FastifyInstance;
  const mockUserRepo = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    app = createApp({ userRepository: mockUserRepo });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/webhooks/revenuecat', () => {
    const user = UserEntity.create('user-1', 'test@example.com', 'Jean');

    it('should activate subscription on INITIAL_PURCHASE', async () => {
      mockUserRepo.findById.mockResolvedValue(user);

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/revenuecat',
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: 'user-1',
            expiration_at_ms: 1711238400000,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionActive: true }),
      );
    });

    it('should deactivate subscription on EXPIRATION', async () => {
      const activeUser = user.activateSubscription('2026-03-24T00:00:00.000Z');
      mockUserRepo.findById.mockResolvedValue(activeUser);

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/revenuecat',
        payload: {
          event: {
            type: 'EXPIRATION',
            app_user_id: 'user-1',
            expiration_at_ms: 0,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockUserRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionActive: false }),
      );
    });

    it('should return 400 when user not found', async () => {
      mockUserRepo.findById.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/revenuecat',
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: 'unknown',
            expiration_at_ms: 0,
          },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid webhook secret when configured', async () => {
      process.env.REVENUECAT_WEBHOOK_SECRET = 'my-secret';

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/revenuecat',
        headers: { authorization: 'Bearer wrong-secret' },
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: 'user-1',
            expiration_at_ms: 0,
          },
        },
      });

      expect(response.statusCode).toBe(401);
      delete process.env.REVENUECAT_WEBHOOK_SECRET;
    });

    it('should accept valid webhook secret', async () => {
      process.env.REVENUECAT_WEBHOOK_SECRET = 'my-secret';
      mockUserRepo.findById.mockResolvedValue(user);

      const response = await app.inject({
        method: 'POST',
        url: '/api/webhooks/revenuecat',
        headers: { authorization: 'Bearer my-secret' },
        payload: {
          event: {
            type: 'INITIAL_PURCHASE',
            app_user_id: 'user-1',
            expiration_at_ms: 1711238400000,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      delete process.env.REVENUECAT_WEBHOOK_SECRET;
    });
  });
});
