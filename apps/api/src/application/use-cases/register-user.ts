import { Email, Password, DisplayName, UserEntity } from '@zeste/domain';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { UserRepositoryPort } from '../ports/user-repository.port';

interface RegisterUserInput {
  email: string;
  password: string;
  displayName: string;
}

interface RegisterUserOutput {
  id: string;
  email: string;
}

export class RegisterUser {
  constructor(
    private readonly authService: AuthServicePort,
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    // Validate domain rules
    new Email(input.email);
    new Password(input.password);
    new DisplayName(input.displayName);

    // Register in auth provider
    const authUser = await this.authService.register(input.email, input.password);

    // Create domain entity and persist
    const user = UserEntity.create(authUser.id, input.email, input.displayName);
    await this.userRepository.save(user);

    return { id: authUser.id, email: authUser.email };
  }
}
