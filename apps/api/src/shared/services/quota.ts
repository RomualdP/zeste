import { QUOTAS, type TargetDuration } from '@zeste/shared';

export class QuotaService {
  static checkProjectQuota(currentProjectCount: number): void {
    if (currentProjectCount >= QUOTAS.maxProjects) {
      throw new Error(`Maximum ${QUOTAS.maxProjects} projects allowed`);
    }
  }

  static checkSourceQuota(currentSourceCount: number): void {
    if (currentSourceCount >= QUOTAS.maxSourcesPerProject) {
      throw new Error(`Maximum ${QUOTAS.maxSourcesPerProject} sources per project allowed`);
    }
  }

  static checkDurationQuota(targetDuration: TargetDuration): void {
    if (targetDuration > QUOTAS.maxAudioDurationMinutes) {
      throw new Error(`Maximum ${QUOTAS.maxAudioDurationMinutes} minutes allowed`);
    }
  }
}
