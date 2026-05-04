import type { GenerationPhase } from '@zeste/shared';

export interface GenerationStatus {
  phase: GenerationPhase;
  progress: number;
  error?: string | null;
}

export interface GenerationStatusRepositoryPort {
  getStatus(projectId: string): Promise<GenerationStatus | null>;
  updatePhase(projectId: string, phase: GenerationPhase, progress: number): Promise<void>;
  setError(projectId: string, message: string): Promise<void>;
}
