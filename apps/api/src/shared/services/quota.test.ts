import { describe, it, expect } from 'vitest';
import { QuotaService } from './quota';
import { TargetDuration } from '@zeste/shared';

describe('QuotaService', () => {
  describe('checkProjectQuota', () => {
    it('should allow user with less than 20 projects', () => {
      expect(() => QuotaService.checkProjectQuota(19)).not.toThrow();
    });

    it('should reject user at 20 projects', () => {
      expect(() => QuotaService.checkProjectQuota(20)).toThrow('Maximum 20 projects');
    });
  });

  describe('checkSourceQuota', () => {
    it('should allow user with less than 10 sources', () => {
      expect(() => QuotaService.checkSourceQuota(9)).not.toThrow();
    });

    it('should reject user at 10 sources', () => {
      expect(() => QuotaService.checkSourceQuota(10)).toThrow('Maximum 10 sources');
    });
  });

  describe('checkDurationQuota', () => {
    it('should allow 60 minutes or less', () => {
      expect(() => QuotaService.checkDurationQuota(60)).not.toThrow();
    });

    it('should reject duration exceeding 60 minutes', () => {
      expect(() => QuotaService.checkDurationQuota(90 as TargetDuration)).toThrow('Maximum 60 minutes');
    });
  });
});
