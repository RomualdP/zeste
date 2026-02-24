import type { SupabaseClient } from '@supabase/supabase-js';
import { UserEntity, Email, DisplayName } from '@zeste/domain';
import type { UserRepositoryPort } from '../application/ports/user-repository.port';

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  created_at: string;
}

export class SupabaseUserRepository implements UserRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as UserRow);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return this.toDomain(data as UserRow);
  }

  async save(user: UserEntity): Promise<void> {
    const { error } = await this.client.from('users').upsert({
      id: user.id,
      email: user.email.value,
      display_name: user.displayName.value,
      subscription_active: user.subscriptionActive,
      subscription_expires_at: user.subscriptionExpiresAt,
      created_at: user.createdAt,
    });

    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  private toDomain(row: UserRow): UserEntity {
    return new UserEntity(row.id, {
      email: new Email(row.email),
      displayName: new DisplayName(row.display_name),
      subscriptionActive: row.subscription_active ?? false,
      subscriptionExpiresAt: row.subscription_expires_at ?? null,
      createdAt: row.created_at,
    });
  }
}
