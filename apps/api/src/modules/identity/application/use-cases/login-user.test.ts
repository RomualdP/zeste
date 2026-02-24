import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUser } from './login-user';
import type { AuthServicePort } from '../ports/auth-service.port';

describe('LoginUser', () => {
  let useCase: LoginUser;
  let authService: AuthServicePort;

  beforeEach(() => {
    authService = {
      register: vi.fn(),
      login: vi.fn().mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', email: 'test@example.com' },
      }),
      logout: vi.fn(),
      verifyToken: vi.fn(),
      deleteUser: vi.fn(),
    };
    useCase = new LoginUser(authService);
  });

  it('should return tokens on valid credentials', async () => {
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.id).toBe('user-1');
    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'Password1');
  });

  it('should reject invalid email format', async () => {
    await expect(
      useCase.execute({ email: 'not-email', password: 'Password1' }),
    ).rejects.toThrow('Invalid email');
  });

  it('should propagate auth service errors', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'Password1' }),
    ).rejects.toThrow('Invalid credentials');
  });
});
