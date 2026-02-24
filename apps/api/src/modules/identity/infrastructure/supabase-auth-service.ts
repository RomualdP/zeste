import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthServicePort, AuthTokens, AuthUser } from '../application/ports/auth-service.port';

export class SupabaseAuthService implements AuthServicePort {
  constructor(
    private readonly client: SupabaseClient,
    private readonly serviceClient: SupabaseClient,
  ) {}

  async register(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');
    return { id: data.user.id, email: data.user.email! };
  }

  async login(email: string, password: string): Promise<AuthTokens & { user: AuthUser }> {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session || !data.user) throw new Error('Login failed');
    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email! },
    };
  }

  async logout(accessToken: string): Promise<void> {
    // Create a client scoped to the user's session
    const { error } = await this.client.auth.admin.signOut(accessToken);
    if (error) {
      // Fallback: signOut without scope
      const { error: fallbackError } = await this.client.auth.signOut();
      if (fallbackError) throw new Error(fallbackError.message);
    }
  }

  async verifyToken(accessToken: string): Promise<AuthUser> {
    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Invalid token');
    return { id: data.user.id, email: data.user.email! };
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.serviceClient.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  }
}
