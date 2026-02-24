import { Entity } from '../base';
import { SourceType, SourceStatus } from '@zeste/shared';

interface SourceProps {
  projectId: string;
  type: SourceType;
  url: string | null;
  filePath: string | null;
  rawContent: string;
  status: SourceStatus;
  errorMessage: string | null;
  createdAt: string;
}

export class SourceEntity extends Entity {
  readonly projectId: string;
  readonly type: SourceType;
  readonly url: string | null;
  readonly filePath: string | null;
  readonly rawContent: string;
  readonly status: SourceStatus;
  readonly errorMessage: string | null;
  readonly createdAt: string;

  constructor(id: string, props: SourceProps) {
    super(id);
    this.projectId = props.projectId;
    this.type = props.type;
    this.url = props.url;
    this.filePath = props.filePath;
    this.rawContent = props.rawContent;
    this.status = props.status;
    this.errorMessage = props.errorMessage;
    this.createdAt = props.createdAt;
  }

  static createUrl(id: string, projectId: string, url: string): SourceEntity {
    return new SourceEntity(id, {
      projectId,
      type: SourceType.Url,
      url,
      filePath: null,
      rawContent: '',
      status: SourceStatus.Pending,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    });
  }

  static createPdf(id: string, projectId: string, filePath: string): SourceEntity {
    return new SourceEntity(id, {
      projectId,
      type: SourceType.Pdf,
      url: null,
      filePath,
      rawContent: '',
      status: SourceStatus.Pending,
      errorMessage: null,
      createdAt: new Date().toISOString(),
    });
  }

  markIngested(rawContent: string): SourceEntity {
    if (this.status !== SourceStatus.Pending) {
      throw new Error(`Cannot mark ingested from status "${this.status}"`);
    }
    return new SourceEntity(this.id, {
      ...this.toProps(),
      rawContent,
      status: SourceStatus.Ingested,
    });
  }

  markError(errorMessage: string): SourceEntity {
    return new SourceEntity(this.id, {
      ...this.toProps(),
      status: SourceStatus.Error,
      errorMessage,
    });
  }

  get wordCount(): number {
    return this.rawContent.split(/\s+/).filter(Boolean).length;
  }

  private toProps(): SourceProps {
    return {
      projectId: this.projectId,
      type: this.type,
      url: this.url,
      filePath: this.filePath,
      rawContent: this.rawContent,
      status: this.status,
      errorMessage: this.errorMessage,
      createdAt: this.createdAt,
    };
  }
}
