import { Entity } from '../base';
import { ChapterStatus } from '@zeste/shared';
import type { ScriptEntry } from '@zeste/shared';

interface ChapterProps {
  projectId: string;
  title: string;
  summary: string;
  position: number;
  script: ScriptEntry[];
  audioPath: string | null;
  audioDuration: number | null;
  status: ChapterStatus;
  createdAt: string;
}

export class ChapterEntity extends Entity {
  readonly projectId: string;
  readonly title: string;
  readonly summary: string;
  readonly position: number;
  readonly script: ScriptEntry[];
  readonly audioPath: string | null;
  readonly audioDuration: number | null;
  readonly status: ChapterStatus;
  readonly createdAt: string;

  constructor(id: string, props: ChapterProps) {
    super(id);
    this.projectId = props.projectId;
    this.title = props.title;
    this.summary = props.summary;
    this.position = props.position;
    this.script = props.script;
    this.audioPath = props.audioPath;
    this.audioDuration = props.audioDuration;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  static create(
    id: string,
    projectId: string,
    title: string,
    summary: string,
    position: number,
  ): ChapterEntity {
    return new ChapterEntity(id, {
      projectId,
      title,
      summary,
      position,
      script: [],
      audioPath: null,
      audioDuration: null,
      status: ChapterStatus.Draft,
      createdAt: new Date().toISOString(),
    });
  }

  setScript(script: ScriptEntry[]): ChapterEntity {
    return new ChapterEntity(this.id, {
      ...this.toProps(),
      script,
    });
  }

  startGenerating(): ChapterEntity {
    if (this.status !== ChapterStatus.Draft) {
      throw new Error(`Cannot start generating from status "${this.status}"`);
    }
    return new ChapterEntity(this.id, {
      ...this.toProps(),
      status: ChapterStatus.Generating,
    });
  }

  markReady(audioPath: string, audioDuration: number): ChapterEntity {
    if (this.status !== ChapterStatus.Generating) {
      throw new Error(`Cannot mark ready from status "${this.status}"`);
    }
    return new ChapterEntity(this.id, {
      ...this.toProps(),
      audioPath,
      audioDuration,
      status: ChapterStatus.Ready,
    });
  }

  markError(): ChapterEntity {
    return new ChapterEntity(this.id, {
      ...this.toProps(),
      status: ChapterStatus.Error,
    });
  }

  reposition(newPosition: number): ChapterEntity {
    return new ChapterEntity(this.id, {
      ...this.toProps(),
      position: newPosition,
    });
  }

  private toProps(): ChapterProps {
    return {
      projectId: this.projectId,
      title: this.title,
      summary: this.summary,
      position: this.position,
      script: this.script,
      audioPath: this.audioPath,
      audioDuration: this.audioDuration,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}
