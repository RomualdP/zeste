import type { IngestionServicePort, IngestionResult } from '../application/ports/ingestion-service.port';

const JINA_READER_URL = 'https://r.jina.ai/';

export class JinaIngestionService implements IngestionServicePort {
  constructor(private readonly apiKey: string) {}

  async ingestUrl(url: string): Promise<IngestionResult> {
    const response = await fetch(`${JINA_READER_URL}${url}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'text/markdown',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jina Reader error (${response.status}): ${errorText}`);
    }

    const content = await response.text();

    if (!content.trim()) {
      throw new Error('No content extracted from URL');
    }

    return { content };
  }

  async ingestPdf(_filePath: string): Promise<IngestionResult> {
    throw new Error('PDF ingestion not yet implemented');
  }
}
