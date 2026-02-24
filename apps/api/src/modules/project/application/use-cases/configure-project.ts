import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import type { SourceRepositoryPort } from '../ports/source-repository.port';
import { Tone, TargetDuration, SourceStatus, AUDIO } from '@zeste/shared';
import type { ProjectEntity } from '@zeste/domain';

interface ConfigureProjectInput {
  userId: string;
  projectId: string;
  tone: Tone;
  targetDuration: TargetDuration;
  chapterCount: number;
}

export class ConfigureProject {
  constructor(
    private readonly projectRepository: ProjectRepositoryPort,
    private readonly sourceRepository: SourceRepositoryPort,
  ) {}

  async execute(input: ConfigureProjectInput): Promise<ProjectEntity> {
    const project = await this.projectRepository.findById(input.projectId);
    if (!project || project.userId !== input.userId) {
      throw new Error('Project not found');
    }

    const sources = await this.sourceRepository.findByProjectId(input.projectId);
    const ingestedSources = sources.filter((s) => s.status === SourceStatus.Ingested);
    if (ingestedSources.length === 0) {
      throw new Error('Project must have at least one ingested source');
    }

    const maxChapters = AUDIO.MAX_CHAPTERS_PER_DURATION[input.targetDuration];
    if (input.chapterCount > maxChapters) {
      throw new Error(`Maximum ${maxChapters} chapters for ${input.targetDuration}min duration`);
    }

    const configured = project.configure(input.tone, input.targetDuration, input.chapterCount);
    await this.projectRepository.save(configured);

    return configured;
  }
}
