export interface AudioStoragePort {
  upload(projectId: string, chapterId: string, audioBuffer: Buffer): Promise<string>;
  getUrl(audioPath: string): Promise<string>;
  delete(audioPath: string): Promise<void>;
}
