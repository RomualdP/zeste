import type { AuthServicePort } from '../ports/auth-service.port';
import type { UserRepositoryPort } from '../ports/user-repository.port';

interface DeleteAccountInput {
  userId: string;
}

export class DeleteAccount {
  constructor(
    private readonly authService: AuthServicePort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    // Delete user data first, then auth account
    await this.userRepository.delete(input.userId);
    await this.authService.deleteUser(input.userId);
  }
}
