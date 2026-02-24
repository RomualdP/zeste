import { describe, it, expect } from 'vitest';
import { Email } from './email';
import { ProjectName } from './project-name';
import { Slug } from './slug';
import { AudioDuration } from './audio-duration';

describe('Email', () => {
  it('should accept a valid email', () => {
    const email = new Email('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('should reject an invalid email', () => {
    expect(() => new Email('not-an-email')).toThrow('Invalid email');
    expect(() => new Email('')).toThrow('Invalid email');
    expect(() => new Email('missing@domain')).toThrow('Invalid email');
  });
});

describe('ProjectName', () => {
  it('should accept a valid name (1-100 chars)', () => {
    const name = new ProjectName('Mon podcast');
    expect(name.value).toBe('Mon podcast');
  });

  it('should reject empty name', () => {
    expect(() => new ProjectName('')).toThrow('between 1 and 100');
    expect(() => new ProjectName('   ')).toThrow('between 1 and 100');
  });

  it('should reject name over 100 characters', () => {
    const longName = 'a'.repeat(101);
    expect(() => new ProjectName(longName)).toThrow('between 1 and 100');
  });

  it('should accept name of exactly 100 characters', () => {
    const name = new ProjectName('a'.repeat(100));
    expect(name.value).toBe('a'.repeat(100));
  });
});

describe('Slug', () => {
  it('should accept a valid URL-safe slug', () => {
    const slug = new Slug('my-podcast-123');
    expect(slug.value).toBe('my-podcast-123');
  });

  it('should accept underscores and hyphens', () => {
    expect(new Slug('abc_def-ghi').value).toBe('abc_def-ghi');
  });

  it('should reject invalid slugs', () => {
    expect(() => new Slug('')).toThrow('Invalid slug');
    expect(() => new Slug('has spaces')).toThrow('Invalid slug');
    expect(() => new Slug('special!chars')).toThrow('Invalid slug');
  });
});

describe('AudioDuration', () => {
  it('should accept a valid duration in seconds', () => {
    const duration = new AudioDuration(125);
    expect(duration.value).toBe(125);
  });

  it('should calculate minutes and seconds', () => {
    const duration = new AudioDuration(125);
    expect(duration.minutes).toBe(2);
    expect(duration.seconds).toBe(5);
  });

  it('should format as mm:ss', () => {
    expect(new AudioDuration(125).formatted).toBe('2:05');
    expect(new AudioDuration(0).formatted).toBe('0:00');
    expect(new AudioDuration(3600).formatted).toBe('60:00');
  });

  it('should reject negative values', () => {
    expect(() => new AudioDuration(-1)).toThrow('non-negative integer');
  });

  it('should reject non-integer values', () => {
    expect(() => new AudioDuration(1.5)).toThrow('non-negative integer');
  });

  it('should accept zero', () => {
    expect(new AudioDuration(0).value).toBe(0);
  });
});
