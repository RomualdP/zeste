import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationPhase } from '@zeste/shared';
import { GenerateFullWorker } from './generate-full-worker';
import type { GenerateChapterPlan } from '../../modules/scenario/application/use-cases/generate-chapter-plan';
import type { GenerateScenario } from '../../modules/scenario/application/use-cases/generate-scenario';
import type { GenerateProjectAudio } from '../../modules/audio/application/use-cases/generate-project-audio';
import type { GenerationStatusRepositoryPort } from '../../modules/project/application/ports/generation-status-repository.port';

describe('GenerateFullWorker', () => {
  let worker: GenerateFullWorker;
  let plan: { execute: ReturnType<typeof vi.fn> };
  let scenario: { execute: ReturnType<typeof vi.fn> };
  let audio: { execute: ReturnType<typeof vi.fn> };
  let statusRepo: GenerationStatusRepositoryPort;

  beforeEach(() => {
    plan = { execute: vi.fn().mockResolvedValue([]) };
    scenario = { execute: vi.fn().mockResolvedValue([]) };
    audio = { execute: vi.fn().mockResolvedValue(undefined) };
    statusRepo = {
      getStatus: vi.fn().mockResolvedValue(null),
      updatePhase: vi.fn().mockResolvedValue(undefined),
      setError: vi.fn().mockResolvedValue(undefined),
    };
    worker = new GenerateFullWorker(
      plan as unknown as GenerateChapterPlan,
      scenario as unknown as GenerateScenario,
      audio as unknown as GenerateProjectAudio,
      statusRepo,
    );
  });

  it('chains plan → scenario → audio in order', async () => {
    const callOrder: string[] = [];
    plan.execute.mockImplementation(async () => {
      callOrder.push('plan');
      return [];
    });
    scenario.execute.mockImplementation(async () => {
      callOrder.push('scenario');
      return [];
    });
    audio.execute.mockImplementation(async () => {
      callOrder.push('audio');
    });

    await worker.run({ userId: 'u-1', projectId: 'p-1' });

    expect(callOrder).toEqual(['plan', 'scenario', 'audio']);
    expect(plan.execute).toHaveBeenCalledWith({ userId: 'u-1', projectId: 'p-1' });
    expect(scenario.execute).toHaveBeenCalledWith({ userId: 'u-1', projectId: 'p-1' });
    expect(audio.execute).toHaveBeenCalledWith({ userId: 'u-1', projectId: 'p-1' });
  });

  it('updates phase before each step and marks ready at the end', async () => {
    await worker.run({ userId: 'u-1', projectId: 'p-1' });

    const calls = (statusRepo.updatePhase as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toEqual([
      ['p-1', GenerationPhase.Plan, 0],
      ['p-1', GenerationPhase.Scenario, 0.33],
      ['p-1', GenerationPhase.Audio, 0.66],
      ['p-1', GenerationPhase.Ready, 1],
    ]);
  });

  it('marks status as error and rethrows when scenario fails mid-chain', async () => {
    scenario.execute.mockRejectedValue(new Error('LLM down'));

    await expect(worker.run({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow(
      'LLM down',
    );

    expect(audio.execute).not.toHaveBeenCalled();
    expect(statusRepo.setError).toHaveBeenCalledWith('p-1', 'LLM down');
  });

  it('marks status as error if plan fails (very first step)', async () => {
    plan.execute.mockRejectedValue(new Error('No sources'));

    await expect(worker.run({ userId: 'u-1', projectId: 'p-1' })).rejects.toThrow(
      'No sources',
    );

    expect(scenario.execute).not.toHaveBeenCalled();
    expect(statusRepo.setError).toHaveBeenCalledWith('p-1', 'No sources');
  });
});
