import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseChapterRepository } from './supabase-chapter-repository';
import { ChapterEntity } from '@zeste/domain';

function createMockClient() {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn(),
    in: vi.fn(),
  };
  return {
    from: vi.fn().mockReturnValue(chainable),
    _chain: chainable,
  };
}

describe('SupabaseChapterRepository', () => {
  let repo: SupabaseChapterRepository;
  let mockClient: ReturnType<typeof createMockClient>;

  const chapterRow = {
    id: 'ch1',
    project_id: 'p1',
    title: 'Introduction',
    summary: 'Overview of the topic',
    position: 0,
    script: [{ speaker: 'host', text: 'Welcome', tone: 'enthusiastic' }],
    audio_path: null,
    audio_duration: null,
    status: 'draft',
    created_at: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockClient = createMockClient();
    repo = new SupabaseChapterRepository(mockClient as any);
  });

  it('should find a chapter by id', async () => {
    mockClient._chain.single.mockResolvedValue({ data: chapterRow, error: null });

    const chapter = await repo.findById('ch1');

    expect(chapter).toBeInstanceOf(ChapterEntity);
    expect(chapter!.title).toBe('Introduction');
    expect(chapter!.projectId).toBe('p1');
    expect(mockClient.from).toHaveBeenCalledWith('chapters');
  });

  it('should return null when chapter not found', async () => {
    mockClient._chain.single.mockResolvedValue({ data: null, error: { message: 'not found' } });

    const chapter = await repo.findById('unknown');
    expect(chapter).toBeNull();
  });

  it('should find chapters by project id ordered by position', async () => {
    mockClient._chain.order.mockResolvedValue({ data: [chapterRow], error: null });

    const chapters = await repo.findByProjectId('p1');

    expect(chapters).toHaveLength(1);
    expect(chapters[0]!.title).toBe('Introduction');
    expect(mockClient._chain.order).toHaveBeenCalledWith('position', { ascending: true });
  });

  it('should save a chapter via upsert', async () => {
    mockClient._chain.upsert.mockResolvedValue({ error: null });
    const chapter = ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0);

    await repo.save(chapter);

    expect(mockClient._chain.upsert).toHaveBeenCalledWith(expect.objectContaining({
      id: 'ch1',
      project_id: 'p1',
      title: 'Intro',
    }));
  });

  it('should save all chapters via upsert', async () => {
    mockClient._chain.upsert.mockResolvedValue({ error: null });
    const chapters = [
      ChapterEntity.create('ch1', 'p1', 'Intro', 'Overview', 0),
      ChapterEntity.create('ch2', 'p1', 'Main', 'Details', 1),
    ];

    await repo.saveAll(chapters);

    expect(mockClient._chain.upsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: 'ch1' }),
      expect.objectContaining({ id: 'ch2' }),
    ]));
  });

  it('should delete a chapter by id', async () => {
    mockClient._chain.eq.mockResolvedValue({ error: null });

    await repo.delete('ch1');

    expect(mockClient.from).toHaveBeenCalledWith('chapters');
  });

  it('should delete all chapters by project id', async () => {
    mockClient._chain.eq.mockResolvedValue({ error: null });

    await repo.deleteByProjectId('p1');

    expect(mockClient.from).toHaveBeenCalledWith('chapters');
  });
});
