import { describe, it, expect } from 'vitest';
import { UserEntity } from './user';
import { Email } from '../value-objects/email';
import { DisplayName } from '../value-objects/display-name';

describe('UserEntity', () => {
  const makeUser = (overrides?: Partial<{ id: string; email: string; displayName: string }>) =>
    UserEntity.create(
      overrides?.id ?? 'user-1',
      overrides?.email ?? 'test@example.com',
      overrides?.displayName ?? 'Jean Dupont',
    );

  describe('create', () => {
    it('should create a user with inactive subscription', () => {
      const user = makeUser();
      expect(user.id).toBe('user-1');
      expect(user.email).toBeInstanceOf(Email);
      expect(user.email.value).toBe('test@example.com');
      expect(user.displayName).toBeInstanceOf(DisplayName);
      expect(user.displayName.value).toBe('Jean Dupont');
      expect(user.subscriptionActive).toBe(false);
      expect(user.subscriptionExpiresAt).toBeNull();
      expect(user.createdAt).toBeDefined();
    });

    it('should reject invalid email', () => {
      expect(() => makeUser({ email: 'not-an-email' })).toThrow('Invalid email');
    });

    it('should reject invalid display name', () => {
      expect(() => makeUser({ displayName: '' })).toThrow('between 1 and 50 characters');
    });
  });

  describe('activateSubscription', () => {
    it('should activate subscription with expiration date', () => {
      const user = makeUser();
      const expiresAt = '2026-03-24T00:00:00.000Z';
      const activated = user.activateSubscription(expiresAt);
      expect(activated.subscriptionActive).toBe(true);
      expect(activated.subscriptionExpiresAt).toBe(expiresAt);
      expect(activated.id).toBe(user.id);
    });

    it('should return a new instance', () => {
      const user = makeUser();
      const activated = user.activateSubscription('2026-03-24T00:00:00.000Z');
      expect(user).not.toBe(activated);
      expect(user.subscriptionActive).toBe(false);
    });
  });

  describe('deactivateSubscription', () => {
    it('should deactivate subscription', () => {
      const user = makeUser().activateSubscription('2026-03-24T00:00:00.000Z');
      const deactivated = user.deactivateSubscription();
      expect(deactivated.subscriptionActive).toBe(false);
      expect(deactivated.subscriptionExpiresAt).toBe('2026-03-24T00:00:00.000Z');
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
      const updated = user.updateDisplayName('Autre Nom');
      expect(user).not.toBe(updated);
      expect(user.displayName.value).toBe('Jean Dupont');
      expect(updated.displayName.value).toBe('Autre Nom');
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
