import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupabaseAudioStorage } from './supabase-audio-storage';

describe('SupabaseAudioStorage', () => {
  let storage: SupabaseAudioStorage;
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn(),
        createSignedUrl: vi.fn(),
        remove: vi.fn(),
      },
    };
    // Make from() return the same mock for chaining
    mockSupabase.storage.from.mockReturnValue({
      upload: mockSupabase.storage.upload,
      createSignedUrl: mockSupabase.storage.createSignedUrl,
      remove: mockSupabase.storage.remove,
    });
    storage = new SupabaseAudioStorage(mockSupabase);
  });

  describe('upload', () => {
    it('should upload audio buffer and return path', async () => {
      mockSupabase.storage.upload.mockResolvedValue({
        data: { path: 'project-1/chapter-1.mp3' },
        error: null,
      });

      const buffer = Buffer.from('fake-audio-data');
      const path = await storage.upload('project-1', 'chapter-1', buffer);

      expect(path).toBe('project-1/chapter-1.mp3');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio');
      expect(mockSupabase.storage.upload).toHaveBeenCalledWith(
        'project-1/chapter-1.mp3',
        buffer,
        expect.objectContaining({ contentType: 'audio/mpeg' }),
      );
    });

    it('should throw on upload error', async () => {
      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found' },
      });

      await expect(
        storage.upload('p1', 'c1', Buffer.from('data')),
      ).rejects.toThrow('Bucket not found');
    });
  });

  describe('getUrl', () => {
    it('should return a signed URL', async () => {
      mockSupabase.storage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://storage.supabase.co/audio/signed-url' },
        error: null,
      });

      const url = await storage.getUrl('project-1/chapter-1.mp3');

      expect(url).toBe('https://storage.supabase.co/audio/signed-url');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio');
      expect(mockSupabase.storage.createSignedUrl).toHaveBeenCalledWith(
        'project-1/chapter-1.mp3',
        3600,
      );
    });

    it('should throw on getUrl error', async () => {
      mockSupabase.storage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'File not found' },
      });

      await expect(
        storage.getUrl('bad/path.mp3'),
      ).rejects.toThrow('File not found');
    });
  });

  describe('delete', () => {
    it('should delete the file from storage', async () => {
      mockSupabase.storage.remove.mockResolvedValue({
        data: [{ name: 'chapter-1.mp3' }],
        error: null,
      });

      await storage.delete('project-1/chapter-1.mp3');

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio');
      expect(mockSupabase.storage.remove).toHaveBeenCalledWith([
        'project-1/chapter-1.mp3',
      ]);
    });

    it('should throw on delete error', async () => {
      mockSupabase.storage.remove.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      await expect(
        storage.delete('bad/path.mp3'),
      ).rejects.toThrow('Permission denied');
    });
  });
});
