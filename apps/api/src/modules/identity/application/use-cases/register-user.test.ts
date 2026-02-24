import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUser } from './register-user';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { UserRepositoryPort } from '../ports/user-repository.port';

describe('RegisterUser', () => {
  let useCase: RegisterUser;
  let authService: AuthServicePort;
  let userRepository: UserRepositoryPort;

  beforeEach(() => {
    authService = {
      register: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@example.com' }),
      login: vi.fn(),
      logout: vi.fn(),
      verifyToken: vi.fn(),
      deleteUser: vi.fn(),
    };
    userRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByEmail: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    useCase = new RegisterUser(authService, userRepository);
  });

  it('should register a user with valid email and password', async () => {
    const result = await useCase.execute({
      email: 'test@example.com',
      password: 'Password1',
      displayName: 'Jean Dupont',
    });

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('test@example.com');
    expect(authService.register).toHaveBeenCalledWith('test@example.com', 'Password1');
    expect(userRepository.save).toHaveBeenCalled();
  });

  it('should reject invalid email', async () => {
    await expect(
      useCase.execute({ email: 'not-email', password: 'Password1', displayName: 'Jean' }),
    ).rejects.toThrow('Invalid email');
  });

  it('should reject weak password', async () => {
    await expect(
      useCase.execute({ email: 'test@example.com', password: 'weak', displayName: 'Jean' }),
    ).rejects.toThrow('at least 8 characters');
  });

  it('should reject empty display name', async () => {
    await expect(
      useCase.execute({ email: 'test@example.com', password: 'Password1', displayName: '' }),
    ).rejects.toThrow('between 1 and 50 characters');
  });

  it('should propagate auth service errors', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error('Email already registered'));

    await expect(
      useCase.execute({ email: 'test@example.com', password: 'Password1', displayName: 'Jean' }),
    ).rejects.toThrow('Email already registered');
  });
});
