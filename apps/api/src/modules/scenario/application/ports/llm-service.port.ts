import type { Tone, ScriptEntry } from '@zeste/shared';

export interface ChapterPlanItem {
  title: string;
  summary: string;
}

export interface LlmServicePort {
  generateChapterPlan(input: {
    sources: string[];
    tone: Tone;
    chapterCount: number;
  }): Promise<ChapterPlanItem[]>;

  generateChapterScript(input: {
    chapterTitle: string;
    chapterSummary: string;
    sources: string[];
    tone: Tone;
    targetWordCount: number;
    previousChaptersContext: string[];
  }): Promise<ScriptEntry[]>;
}
