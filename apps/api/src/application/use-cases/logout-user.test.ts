import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LogoutUser } from './logout-user';
import type { AuthServicePort } from '../ports/auth-service.port';

describe('LogoutUser', () => {
  let useCase: LogoutUser;
  let authService: AuthServicePort;

  beforeEach(() => {
    authService = {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      verifyToken: vi.fn(),
      deleteUser: vi.fn(),
    };
    useCase = new LogoutUser(authService);
  });

  it('should logout successfully', async () => {
    await useCase.execute({ accessToken: 'valid-token' });
    expect(authService.logout).toHaveBeenCalledWith('valid-token');
  });

  it('should propagate auth service errors', async () => {
    vi.mocked(authService.logout).mockRejectedValue(new Error('Invalid token'));

    await expect(
      useCase.execute({ accessToken: 'invalid-token' }),
    ).rejects.toThrow('Invalid token');
  });
});
