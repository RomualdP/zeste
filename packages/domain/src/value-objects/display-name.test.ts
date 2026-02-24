import { describe, it, expect } from 'vitest';
import { DisplayName } from './display-name';

describe('DisplayName', () => {
  it('should accept a valid display name', () => {
    const name = new DisplayName('Jean Dupont');
    expect(name.value).toBe('Jean Dupont');
  });

  it('should trim whitespace', () => {
    const name = new DisplayName('  Jean Dupont  ');
    expect(name.value).toBe('Jean Dupont');
  });

  it('should accept a single character name', () => {
    const name = new DisplayName('J');
    expect(name.value).toBe('J');
  });

  it('should accept a 50-character name', () => {
    const longName = 'A'.repeat(50);
    const name = new DisplayName(longName);
    expect(name.value).toBe(longName);
  });

  it('should reject an empty name', () => {
    expect(() => new DisplayName('')).toThrow('between 1 and 50 characters');
  });

  it('should reject a whitespace-only name', () => {
    expect(() => new DisplayName('   ')).toThrow('between 1 and 50 characters');
  });

  it('should reject a name longer than 50 characters', () => {
    expect(() => new DisplayName('A'.repeat(51))).toThrow('between 1 and 50 characters');
  });

  it('should compare equality correctly', () => {
    const n1 = new DisplayName('Jean');
    const n2 = new DisplayName('Jean');
    const n3 = new DisplayName('Pierre');
    expect(n1.equals(n2)).toBe(true);
    expect(n1.equals(n3)).toBe(false);
  });
});
