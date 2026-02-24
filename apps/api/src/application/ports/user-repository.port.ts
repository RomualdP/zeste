import type { UserEntity } from '@zeste/domain';

export interface UserRepositoryPort {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  save(user: UserEntity): Promise<void>;
  delete(id: string): Promise<void>;
}
