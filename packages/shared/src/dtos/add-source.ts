import type { SourceType } from '../enums';

export interface AddSourceDto {
  projectId: string;
  type: SourceType;
  url?: string;
}
