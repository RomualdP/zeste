import { Entity } from '../base';
import { ProjectStatus, Tone, TargetDuration, AUDIO } from '@zeste/shared';

interface ProjectProps {
  userId: string;
  name: string;
  tone: Tone;
  targetDuration: TargetDuration;
  chapterCount: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export class ProjectEntity extends Entity {
  readonly userId: string;
  readonly name: string;
  readonly tone: Tone;
  readonly targetDuration: TargetDuration;
  readonly chapterCount: number;
  readonly status: ProjectStatus;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(id: string, props: ProjectProps) {
    super(id);
    this.userId = props.userId;
    this.name = props.name;
    this.tone = props.tone;
    this.targetDuration = props.targetDuration;
    this.chapterCount = props.chapterCount;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(id: string, userId: string, name: string): ProjectEntity {
    const now = new Date().toISOString();
    return new ProjectEntity(id, {
      userId,
      name,
      tone: Tone.Pedagogue,
      targetDuration: TargetDuration.Medium,
      chapterCount: AUDIO.DEFAULT_CHAPTERS[TargetDuration.Medium],
      status: ProjectStatus.Draft,
      createdAt: now,
      updatedAt: now,
    });
  }

  configure(tone: Tone, targetDuration: TargetDuration, chapterCount: number): ProjectEntity {
    if (this.status !== ProjectStatus.Draft) {
      throw new Error(`Cannot configure project in status "${this.status}"`);
    }
    if (chapterCount < AUDIO.MIN_CHAPTERS || chapterCount > AUDIO.MAX_CHAPTERS) {
      throw new Error(
        `Chapter count must be between ${AUDIO.MIN_CHAPTERS} and ${AUDIO.MAX_CHAPTERS}`,
      );
    }
    return new ProjectEntity(this.id, {
      ...this.toProps(),
      tone,
      targetDuration,
      chapterCount,
      updatedAt: new Date().toISOString(),
    });
  }

  startProcessing(): ProjectEntity {
    if (this.status !== ProjectStatus.Draft) {
      throw new Error(`Cannot start processing from status "${this.status}"`);
    }
    return new ProjectEntity(this.id, {
      ...this.toProps(),
      status: ProjectStatus.Processing,
      updatedAt: new Date().toISOString(),
    });
  }

  markReady(): ProjectEntity {
    if (this.status !== ProjectStatus.Processing) {
      throw new Error(`Cannot mark ready from status "${this.status}"`);
    }
    return new ProjectEntity(this.id, {
      ...this.toProps(),
      status: ProjectStatus.Ready,
      updatedAt: new Date().toISOString(),
    });
  }

  markError(): ProjectEntity {
    if (this.status !== ProjectStatus.Processing) {
      throw new Error(`Cannot mark error from status "${this.status}"`);
    }
    return new ProjectEntity(this.id, {
      ...this.toProps(),
      status: ProjectStatus.Error,
      updatedAt: new Date().toISOString(),
    });
  }

  get canBeConfigured(): boolean {
    return this.status === ProjectStatus.Draft;
  }

  get canStartProcessing(): boolean {
    return this.status === ProjectStatus.Draft;
  }

  private toProps(): ProjectProps {
    return {
      userId: this.userId,
      name: this.name,
      tone: this.tone,
      targetDuration: this.targetDuration,
      chapterCount: this.chapterCount,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
