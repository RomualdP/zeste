import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseSharedLinkRepository } from './supabase-shared-link-repository';
import { SharedLinkEntity } from '@zeste/domain';

function createMockClient() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn(),
  };
  return {
    from: vi.fn().mockReturnValue(chainable),
    _chain: chainable,
  };
}

describe('SupabaseSharedLinkRepository', () => {
  let repo: SupabaseSharedLinkRepository;
  let mockClient: ReturnType<typeof createMockClient>;

  const linkRow = {
    id: 'sl1',
    project_id: 'p1',
    slug: 'abc123',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockClient = createMockClient();
    repo = new SupabaseSharedLinkRepository(mockClient as any);
  });

  it('should find a link by id', async () => {
    mockClient._chain.single.mockResolvedValue({ data: linkRow, error: null });

    const link = await repo.findById('sl1');

    expect(link).toBeInstanceOf(SharedLinkEntity);
    expect(link!.slug).toBe('abc123');
    expect(mockClient.from).toHaveBeenCalledWith('shared_links');
  });

  it('should find a link by project id', async () => {
    mockClient._chain.single.mockResolvedValue({ data: linkRow, error: null });

    const link = await repo.findByProjectId('p1');

    expect(link).toBeInstanceOf(SharedLinkEntity);
    expect(link!.projectId).toBe('p1');
  });

  it('should find a link by slug', async () => {
    mockClient._chain.single.mockResolvedValue({ data: linkRow, error: null });

    const link = await repo.findBySlug('abc123');

    expect(link).toBeInstanceOf(SharedLinkEntity);
    expect(link!.slug).toBe('abc123');
  });

  it('should return null when link not found', async () => {
    mockClient._chain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const link = await repo.findBySlug('unknown');
    expect(link).toBeNull();
  });

  it('should save a link via upsert', async () => {
    mockClient._chain.upsert.mockResolvedValue({ error: null });
    const link = SharedLinkEntity.create('sl1', 'p1', 'abc123');

    await repo.save(link);

    expect(mockClient._chain.upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'sl1',
      project_id: 'p1',
      slug: 'abc123',
      is_active: true,
    }));
  });

  it('should delete a link by id', async () => {
    mockClient._chain.eq.mockResolvedValue({ error: null });

    await repo.delete('sl1');

    expect(mockClient.from).toHaveBeenCalledWith('shared_links');
  });
});
