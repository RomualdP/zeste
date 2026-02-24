export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthServicePort {
  register(email: string, password: string): Promise<AuthUser>;
  login(email: string, password: string): Promise<AuthTokens & { user: AuthUser }>;
  logout(accessToken: string): Promise<void>;
  verifyToken(accessToken: string): Promise<AuthUser>;
  deleteUser(userId: string): Promise<void>;
}
