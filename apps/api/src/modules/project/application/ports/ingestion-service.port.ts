export interface IngestionResult {
  content: string;
}

export interface IngestionServicePort {
  ingestUrl(url: string): Promise<IngestionResult>;
  ingestPdf(filePath: string): Promise<IngestionResult>;
}
