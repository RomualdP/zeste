import type { ProjectStatus, Tone, TargetDuration } from '../enums';
export interface Project {
    id: string;
    userId: string;
    name: string;
    tone: Tone;
    targetDuration: TargetDuration;
    chapterCount: number;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=project.d.ts.map