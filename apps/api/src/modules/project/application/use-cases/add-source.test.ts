import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddSource } from './add-source';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import type { IngestionServicePort } from '../ports/ingestion-service.port';
import { ProjectEntity } from '@zeste/domain';
import { SourceStatus, SourceType } from '@zeste/shared';

describe('AddSource', () => {
  let useCase: AddSource;
  let sourceRepository: SourceRepositoryPort;
  let projectRepository: ProjectRepositoryPort;
  let ingestionService: IngestionServicePort;

  beforeEach(() => {
    sourceRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([]),
      save: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ProjectEntity.create('p1', 'user-1', 'Test')),
      findByUserId: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    };
    ingestionService = {
      ingestUrl: vi.fn().mockResolvedValue({ content: '# Title\n\nSome content here' }),
      ingestPdf: vi.fn().mockResolvedValue({ content: '# PDF Content\n\nExtracted text' }),
    };
    useCase = new AddSource(sourceRepository, projectRepository, ingestionService);
  });

  it('should add a URL source and ingest content', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      type: SourceType.Url,
      url: 'https://example.com/article',
    });

    expect(result.type).toBe(SourceType.Url);
    expect(result.url).toBe('https://example.com/article');
    expect(result.status).toBe(SourceStatus.Ingested);
    expect(result.rawContent).toBe('# Title\n\nSome content here');
    expect(sourceRepository.save).toHaveBeenCalledTimes(2); // pending + ingested
  });

  it('should mark source as error when ingestion fails', async () => {
    vi.mocked(ingestionService.ingestUrl).mockRejectedValue(new Error('URL inaccessible'));

    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      type: SourceType.Url,
      url: 'https://broken.com',
    });

    expect(result.status).toBe(SourceStatus.Error);
    expect(result.errorMessage).toBe('URL inaccessible');
  });

  it('should add a PDF source and ingest content', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      projectId: 'p1',
      type: SourceType.Pdf,
      filePath: 'uploads/doc.pdf',
    });

    expect(result.type).toBe(SourceType.Pdf);
    expect(result.status).toBe(SourceStatus.Ingested);
    expect(result.rawContent).toBe('# PDF Content\n\nExtracted text');
  });

  it('should throw when project not found', async () => {
    vi.mocked(projectRepository.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', type: SourceType.Url, url: 'https://example.com' }),
    ).rejects.toThrow('Project not found');
  });

  it('should throw when user does not own the project', async () => {
    await expect(
      useCase.execute({ userId: 'other-user', projectId: 'p1', type: SourceType.Url, url: 'https://example.com' }),
    ).rejects.toThrow('Project not found');
  });

  it('should require url for URL type', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', type: SourceType.Url }),
    ).rejects.toThrow('URL is required');
  });

  it('should require filePath for PDF type', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', projectId: 'p1', type: SourceType.Pdf }),
    ).rejects.toThrow('File path is required');
  });
});
