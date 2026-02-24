import { describe, it, expect } from 'vitest';
import { SharedLinkEntity } from './shared-link';

describe('SharedLinkEntity', () => {
  it('should create a shared link', () => {
    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');
    expect(link.id).toBe('sl1');
    expect(link.projectId).toBe('p1');
    expect(link.slug).toBe('abc123');
    expect(link.isActive).toBe(true);
  });

  it('should reject invalid slug', () => {
    expect(() => SharedLinkEntity.create('sl1', 'p1', 'has spaces')).toThrow('Invalid slug');
  });

  it('should deactivate a link', () => {
    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');
    const deactivated = link.deactivate();
    expect(deactivated.isActive).toBe(false);
    expect(deactivated.id).toBe('sl1');
  });

  it('should reject deactivating already inactive link', () => {
    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123').deactivate();
    expect(() => link.deactivate()).toThrow('already inactive');
  });
});
