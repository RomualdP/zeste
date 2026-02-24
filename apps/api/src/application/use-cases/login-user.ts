import { Email } from '@zeste/domain';
import type { AuthServicePort, AuthTokens, AuthUser } from '../ports/auth-service.port';

interface LoginUserInput {
  email: string;
  password: string;
}

interface LoginUserOutput extends AuthTokens {
  user: AuthUser;
}

export class LoginUser {
  constructor(private readonly authService: AuthServicePort) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    // Validate email format
    new Email(input.email);

    return this.authService.login(input.email, input.password);
  }
}
