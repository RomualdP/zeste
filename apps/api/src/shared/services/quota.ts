import { UserTier, QUOTAS, type TargetDuration } from '@zeste/shared';

export class QuotaService {
  static checkProjectQuota(tier: UserTier, currentProjectCount: number): void {
    const quotas = tier === UserTier.Premium ? QUOTAS.PREMIUM : QUOTAS.FREE;
    if (currentProjectCount >= quotas.maxProjects) {
      throw new Error(`Maximum ${quotas.maxProjects} projects for your plan`);
    }
  }

  static checkSourceQuota(tier: UserTier, currentSourceCount: number): void {
    const quotas = tier === UserTier.Premium ? QUOTAS.PREMIUM : QUOTAS.FREE;
    if (currentSourceCount >= quotas.maxSourcesPerProject) {
      throw new Error(`Maximum ${quotas.maxSourcesPerProject} sources per project for your plan`);
    }
  }

  static checkDurationQuota(tier: UserTier, targetDuration: TargetDuration): void {
    const quotas = tier === UserTier.Premium ? QUOTAS.PREMIUM : QUOTAS.FREE;
    if (targetDuration > quotas.maxAudioDurationMinutes) {
      throw new Error(`Maximum ${quotas.maxAudioDurationMinutes} minutes for your plan`);
    }
  }
}
