import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireSubscription } from './require-subscription';
import { UserEntity } from '@zeste/domain';
import type { FastifyRequest, FastifyReply } from 'fastify';

describe('requireSubscription', () => {
  const mockReply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as FastifyReply;

  const mockUserRepo = {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.BYPASS_SUBSCRIPTION;
  });

  it('should return 401 when no user on request', async () => {
    const request = { user: undefined } as FastifyRequest;

    await requireSubscription(request, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 when user has no active subscription', async () => {
    const user = UserEntity.create('user-1', 'test@example.com', 'Jean');
    mockUserRepo.findById.mockResolvedValue(user);

    const request = {
      user: { id: 'user-1', email: 'test@example.com' },
      server: { userRepository: mockUserRepo },
    } as unknown as FastifyRequest;

    await requireSubscription(request, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'SUBSCRIPTION_REQUIRED' }),
      }),
    );
  });

  it('should pass when user has active subscription', async () => {
    const user = UserEntity.create('user-1', 'test@example.com', 'Jean')
      .activateSubscription('2026-12-31T00:00:00.000Z');
    mockUserRepo.findById.mockResolvedValue(user);

    const request = {
      user: { id: 'user-1', email: 'test@example.com' },
      server: { userRepository: mockUserRepo },
    } as unknown as FastifyRequest;

    await requireSubscription(request, mockReply);

    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should bypass check when BYPASS_SUBSCRIPTION is true', async () => {
    process.env.BYPASS_SUBSCRIPTION = 'true';

    const request = { user: undefined } as FastifyRequest;

    await requireSubscription(request, mockReply);

    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockReply.send).not.toHaveBeenCalled();
  });

  it('should return 403 when user not found in database', async () => {
    mockUserRepo.findById.mockResolvedValue(null);

    const request = {
      user: { id: 'user-1', email: 'test@example.com' },
      server: { userRepository: mockUserRepo },
    } as unknown as FastifyRequest;

    await requireSubscription(request, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(403);
  });
});
