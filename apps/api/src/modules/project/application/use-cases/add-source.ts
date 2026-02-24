import { SourceEntity } from '@zeste/domain';
import { SourceType } from '@zeste/shared';
import { randomUUID } from 'crypto';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import type { IngestionServicePort } from '../ports/ingestion-service.port';

interface AddSourceInput {
  userId: string;
  projectId: string;
  type: SourceType;
  url?: string;
  filePath?: string;
}

export class AddSource {
  constructor(
    private readonly sourceRepository: SourceRepositoryPort,
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly ingestionService: IngestionServicePort,
  ) {}

  async execute(input: AddSourceInput): Promise<SourceEntity> {
    // Verify project ownership
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    // Create source entity
    let source: SourceEntity;
    if (input.type === SourceType.Url) {
      if (!input.url) throw new Error('URL is required for URL source type');
      source = SourceEntity.createUrl(randomUUID(), input.projectId, input.url);
    } else {
      if (!input.filePath) throw new Error('File path is required for PDF source type');
      source = SourceEntity.createPdf(randomUUID(), input.projectId, input.filePath);
    }

    // Save as pending
    await this.sourceRepository.save(source);

    // Ingest content
    try {
      const result = input.type === SourceType.Url
        ? await this.ingestionService.ingestUrl(input.url!)
        : await this.ingestionService.ingestPdf(input.filePath!);

      source = source.markIngested(result.content);
    } catch (err: any) {
      source = source.markError(err.message);
    }

    // Save final state
    await this.sourceRepository.save(source);

    return source;
  }
}
