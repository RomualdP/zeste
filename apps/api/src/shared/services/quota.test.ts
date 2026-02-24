import { describe, it, expect } from 'vitest';
import { QuotaService } from './quota';
import { UserTier, TargetDuration } from '@zeste/shared';

describe('QuotaService', () => {
  describe('checkProjectQuota', () => {
    it('should allow free user with less than 3 projects', () => {
      expect(() => QuotaService.checkProjectQuota(UserTier.Free, 2)).not.toThrow();
    });

    it('should reject free user at 3 projects', () => {
      expect(() => QuotaService.checkProjectQuota(UserTier.Free, 3)).toThrow('Maximum 3 projects');
    });

    it('should allow premium user with up to 20 projects', () => {
      expect(() => QuotaService.checkProjectQuota(UserTier.Premium, 19)).not.toThrow();
    });

    it('should reject premium user at 20 projects', () => {
      expect(() => QuotaService.checkProjectQuota(UserTier.Premium, 20)).toThrow('Maximum 20 projects');
    });
  });

  describe('checkSourceQuota', () => {
    it('should allow free user with less than 3 sources', () => {
      expect(() => QuotaService.checkSourceQuota(UserTier.Free, 2)).not.toThrow();
    });

    it('should reject free user at 3 sources', () => {
      expect(() => QuotaService.checkSourceQuota(UserTier.Free, 3)).toThrow('Maximum 3 sources');
    });

    it('should allow premium user with up to 10 sources', () => {
      expect(() => QuotaService.checkSourceQuota(UserTier.Premium, 9)).not.toThrow();
    });

    it('should reject premium user at 10 sources', () => {
      expect(() => QuotaService.checkSourceQuota(UserTier.Premium, 10)).toThrow('Maximum 10 sources');
    });
  });

  describe('checkDurationQuota', () => {
    it('should allow free user with 15min or less', () => {
      expect(() => QuotaService.checkDurationQuota(UserTier.Free, TargetDuration.Medium)).not.toThrow();
    });

    it('should reject free user with 30min', () => {
      expect(() => QuotaService.checkDurationQuota(UserTier.Free, TargetDuration.Long)).toThrow('Maximum 15 minutes');
    });

    it('should allow premium user with 30min', () => {
      expect(() => QuotaService.checkDurationQuota(UserTier.Premium, TargetDuration.Long)).not.toThrow();
    });
  });
});
