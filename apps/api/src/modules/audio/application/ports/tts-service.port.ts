export interface TtsSegment {
  speaker: 'host' | 'expert';
  text: string;
}

export interface TtsResult {
  audioBuffer: Buffer;
  durationMs: number;
}

export interface TtsServicePort {
  synthesizeChapter(segments: TtsSegment[]): Promise<TtsResult>;
}
