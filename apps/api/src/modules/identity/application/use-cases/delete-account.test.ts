import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteAccount } from './delete-account';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { UserRepositoryPort } from '../ports/user-repository.port';

describe('DeleteAccount', () => {
  let useCase: DeleteAccount;
  let authService: AuthServicePort;
  let userRepository: UserRepositoryPort;

  beforeEach(() => {
    authService = {
      register: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      verifyToken: vi.fn(),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    };
    userRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn(),
      save: vi.fn(),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    useCase = new DeleteAccount(authService, userRepository);
  });

  it('should delete user account and data', async () => {
    await useCase.execute({ userId: 'user-1' });

    expect(userRepository.delete).toHaveBeenCalledWith('user-1');
    expect(authService.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('should delete user data before auth account', async () => {
    const callOrder: string[] = [];
    vi.mocked(userRepository.delete).mockImplementation(async () => {
      callOrder.push('repo');
    });
    vi.mocked(authService.deleteUser).mockImplementation(async () => {
      callOrder.push('auth');
    });

    await useCase.execute({ userId: 'user-1' });

    expect(callOrder).toEqual(['repo', 'auth']);
  });

  it('should propagate repository errors', async () => {
    vi.mocked(userRepository.delete).mockRejectedValue(new Error('DB error'));

    await expect(
      useCase.execute({ userId: 'user-1' }),
    ).rejects.toThrow('DB error');
  });
});
