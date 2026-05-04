import { GenerationPhase } from '@zeste/shared';
import type { GenerateChapterPlan } from '../../modules/scenario/application/use-cases/generate-chapter-plan';
import type { GenerateScenario } from '../../modules/scenario/application/use-cases/generate-scenario';
import type { GenerateProjectAudio } from '../../modules/audio/application/use-cases/generate-project-audio';
import type { GenerationStatusRepositoryPort } from '../../modules/project/application/ports/generation-status-repository.port';

export interface GenerateFullJobPayload {
  userId: string;
  projectId: string;
}

export class GenerateFullWorker {
  constructor(
    private readonly generateChapterPlan: GenerateChapterPlan,
    private readonly generateScenario: GenerateScenario,
    private readonly generateProjectAudio: GenerateProjectAudio,
    private readonly statusRepository: GenerationStatusRepositoryPort,
  ) {}

  async run(payload: GenerateFullJobPayload): Promise<void> {
    const { userId, projectId } = payload;

    try {
      await this.statusRepository.updatePhase(projectId, GenerationPhase.Plan, 0);
      await this.generateChapterPlan.execute({ userId, projectId });

      await this.statusRepository.updatePhase(projectId, GenerationPhase.Scenario, 0.33);
      await this.generateScenario.execute({ userId, projectId });

      await this.statusRepository.updatePhase(projectId, GenerationPhase.Audio, 0.66);
      await this.generateProjectAudio.execute({ userId, projectId });

      await this.statusRepository.updatePhase(projectId, GenerationPhase.Ready, 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      await this.statusRepository.setError(projectId, message);
      throw err;
    }
  }
}
