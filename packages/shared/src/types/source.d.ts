import type { SourceType, SourceStatus } from '../enums';
export interface Source {
    id: string;
    projectId: string;
    type: SourceType;
    url: string | null;
    filePath: string | null;
    rawContent: string;
    status: SourceStatus;
    errorMessage: string | null;
    createdAt: string;
}
//# sourceMappingURL=source.d.ts.map