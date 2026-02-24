import type { ChapterStatus } from '../enums';

export interface ScriptEntry {
  speaker: 'host' | 'expert';
  text: string;
  tone: string;
}

export interface Chapter {
  id: string;
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
