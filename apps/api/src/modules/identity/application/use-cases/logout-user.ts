import type { AuthServicePort } from '../ports/auth-service.port';

interface LogoutUserInput {
  accessToken: string;
}

export class LogoutUser {
  constructor(private readonly authService: AuthServicePort) {}

  async execute(input: LogoutUserInput): Promise<void> {
    await this.authService.logout(input.accessToken);
  }
}
