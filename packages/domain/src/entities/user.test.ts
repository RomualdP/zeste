import { describe, it, expect } from 'vitest';
import { UserEntity } from './user';
import { Email } from '../value-objects/email';
import { DisplayName } from '../value-objects/display-name';
import { UserTier } from '@zeste/shared';

describe('UserEntity', () => {
  const makeUser = (overrides?: Partial<{ id: string; email: string; displayName: string; tier: UserTier }>) =>
    UserEntity.create(
      overrides?.id ?? 'user-1',
      overrides?.email ?? 'test@example.com',
      overrides?.displayName ?? 'Jean Dupont',
    );

  describe('create', () => {
    it('should create a user with default free tier', () => {
      const user = makeUser();
      expect(user.id).toBe('user-1');
      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.value).toBe('test@example.com');
      expect(user.displayName).toBeInstanceOf(DisplayName);
      expect(user.displayName.value).toBe('Jean Dupont');
      expect(user.tier).toBe(UserTier.Free);
      expect(user.createdAt).toBeDefined();
    });

    it('should reject invalid email', () => {
      expect(() => makeUser({ email: 'not-an-email' })).toThrow('Invalid email');
    });

    it('should reject invalid display name', () => {
      expect(() => makeUser({ displayName: '' })).toThrow('between 1 and 50 characters');
    });
  });

  describe('upgradeTier', () => {
    it('should upgrade from free to premium', () => {
      const user = makeUser();
      const upgraded = user.upgradeTier();
      expect(upgraded.tier).toBe(UserTier.Premium);
      expect(upgraded.id).toBe(user.id);
      expect(upgraded.email.value).toBe(user.email.value);
    });

    it('should throw when already premium', () => {
      const user = makeUser().upgradeTier();
      expect(() => user.upgradeTier()).toThrow('already premium');
    });
  });

  describe('downgradeTier', () => {
    it('should downgrade from premium to free', () => {
      const user = makeUser().upgradeTier();
      const downgraded = user.downgradeTier();
      expect(downgraded.tier).toBe(UserTier.Free);
    });

    it('should throw when already free', () => {
      const user = makeUser();
      expect(() => user.downgradeTier()).toThrow('already free');
    });
  });

  describe('updateDisplayName', () => {
    it('should update the display name', () => {
      const user = makeUser();
      const updated = user.updateDisplayName('Pierre Martin');
      expect(updated.displayName.value).toBe('Pierre Martin');
      expect(updated.id).toBe(user.id);
    });
  });

  describe('immutability', () => {
    it('should return a new instance on mutation', () => {
      const user = makeUser();
      const upgraded = user.upgradeTier();
      expect(user).not.toBe(upgraded);
      expect(user.tier).toBe(UserTier.Free);
      expect(upgraded.tier).toBe(UserTier.Premium);
    });
  });

  describe('equality', () => {
    it('should be equal when ids match', () => {
      const u1 = makeUser({ id: 'same-id' });
      const u2 = makeUser({ id: 'same-id' });
      expect(u1.equals(u2)).toBe(true);
    });

    it('should not be equal when ids differ', () => {
      const u1 = makeUser({ id: 'id-1' });
      const u2 = makeUser({ id: 'id-2' });
      expect(u1.equals(u2)).toBe(false);
    });
  });
});
