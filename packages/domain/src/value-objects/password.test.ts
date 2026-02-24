import { describe, it, expect } from 'vitest';
import { Password } from './password';

describe('Password', () => {
  it('should accept a valid password', () => {
    const password = new Password('Password1');
    expect(password.value).toBe('Password1');
  });

  it('should accept a password with special characters', () => {
    const password = new Password('MyP@ss1word!');
    expect(password.value).toBe('MyP@ss1word!');
  });

  it('should reject a password shorter than 8 characters', () => {
    expect(() => new Password('Pass1')).toThrow('at least 8 characters');
  });

  it('should reject a password without uppercase letter', () => {
    expect(() => new Password('password1')).toThrow('uppercase letter');
  });

  it('should reject a password without digit', () => {
    expect(() => new Password('Password')).toThrow('digit');
  });

  it('should reject an empty password', () => {
    expect(() => new Password('')).toThrow('at least 8 characters');
  });

  it('should compare equality correctly', () => {
    const p1 = new Password('Password1');
    const p2 = new Password('Password1');
    const p3 = new Password('Different1');
    expect(p1.equals(p2)).toBe(true);
    expect(p1.equals(p3)).toBe(false);
  });
});
