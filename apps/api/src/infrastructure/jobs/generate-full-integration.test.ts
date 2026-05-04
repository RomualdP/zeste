import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerationPhase } from '@zeste/shared';
import { GenerateFullWorker } from './generate-full-worker';
import { GenerateChapterPlan } from '../../modules/scenario/application/use-cases/generate-chapter-plan';
import { GenerateScenario } from '../../modules/scenario/application/use-cases/generate-scenario';
import { GenerateProjectAudio } from '../../modules/audio/application/use-cases/generate-project-audio';
import { ProjectEntity, SourceEntity, ChapterEntity } from '@zeste/domain';
import { Tone, TargetDuration } from '@zeste/shared';
import type { ProjectRepositoryPort } from '../../modules/project/application/ports/project-repository.port';
import type { SourceRepositoryPort } from '../../modules/project/application/ports/source-repository.port';
import type { ChapterRepositoryPort } from '../../modules/scenario/application/ports/chapter-repository.port';
import type { LlmServicePort } from '../../modules/scenario/application/ports/llm-service.port';
import type { TtsServicePort } from '../../modules/audio/application/ports/tts-service.port';
import type { AudioStoragePort } from '../../modules/audio/application/ports/audio-storage.port';
import type { GenerationStatusRepositoryPort } from '../../modules/project/application/ports/generation-status-repository.port';

/**
 * Feature: Unified `/generate-full` pipeline
 * As a backend, when a user triggers full generation, I run plan → scenario → audio
 * sequentially and persist phase/progress so the mobile UI can poll status.
 */
describe('GenerateFullWorker integration (plan → scenario → audio)', () => {
  let project: ProjectEntity;
  let projectRepository: ProjectRepositoryPort;
  let sourceRepository: SourceRepositoryPort;
  let chapterRepository: ChapterRepositoryPort;
  let llmService: LlmServicePort;
  let ttsService: TtsServicePort;
  let audioStorage: AudioStoragePort;
  let statusRepository: GenerationStatusRepositoryPort;
  let phaseHistory: Array<{ phase: string; progress: number }>;

  beforeEach(() => {
    project = ProjectEntity.create('p-1', 'user-1', 'Mon podcast').configure(
      Tone.Pedagogue,
      TargetDuration.Short,
      2,
    );
    const ingested = SourceEntity.createUrl('s-1', 'p-1', 'https://x.test').markIngested(
      'Some content',
    );
    const planChapters = [
      ChapterEntity.create('00000000-0000-0000-0000-000000000001', 'p-1', 'Intro', 'Sum1', 0),
      ChapterEntity.create('00000000-0000-0000-0000-000000000002', 'p-1', 'Outro', 'Sum2', 1),
    ];
    const scenarioChapters = planChapters.map((c) =>
      c.setScript([
        { speaker: 'host', text: 'Hello', tone: 'enthusiastic' },
        { speaker: 'expert', text: 'Hi', tone: 'friendly' },
      ]),
    );

    let currentProject = project;
    projectRepository = {
      findById: vi.fn(async () => currentProject),
      findByUserId: vi.fn(),
      save: vi.fn(async (p) => {
        currentProject = p;
      }),
      delete: vi.fn(),
    };
    sourceRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue([ingested]),
      save: vi.fn(),
      delete: vi.fn(),
    };
    chapterRepository = {
      findById: vi.fn(),
      findByProjectId: vi.fn().mockResolvedValue(scenarioChapters),
      save: vi.fn().mockResolvedValue(undefined),
      saveAll: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
      deleteByProjectId: vi.fn().mockResolvedValue(undefined),
    };
    llmService = {
      generateChapterPlan: vi.fn().mockResolvedValue([
        { title: 'Intro', summary: 'Sum1' },
        { title: 'Outro', summary: 'Sum2' },
      ]),
      generateChapterScript: vi.fn().mockResolvedValue([
        { speaker: 'host', text: 'Hello', tone: 'enthusiastic' },
        { speaker: 'expert', text: 'Hi', tone: 'friendly' },
      ]),
    };
    ttsService = {
      synthesizeChapter: vi.fn().mockResolvedValue({
        audioBuffer: Buffer.from('fake-audio'),
        durationMs: 4200,
      }),
    };
    audioStorage = {
      upload: vi.fn().mockResolvedValue('storage://chapter.mp3'),
      delete: vi.fn(),
      getUrl: vi.fn(),
    };
    phaseHistory = [];
    statusRepository = {
      getStatus: vi.fn(),
      updatePhase: vi.fn(async (_pid, phase, progress) => {
        phaseHistory.push({ phase, progress });
      }),
      setError: vi.fn(),
    };
  });

  function buildWorker() {
    return new GenerateFullWorker(
      new GenerateChapterPlan(projectRepository, sourceRepository, chapterRepository, llmService),
      new GenerateScenario(projectRepository, sourceRepository, chapterRepository, llmService),
      new GenerateProjectAudio(projectRepository, chapterRepository, ttsService, audioStorage),
      statusRepository,
    );
  }

  // Scenario: Nominal full generation
  // Given a configured project with one ingested source
  // When the worker runs the unified pipeline
  // Then phases progress idle → plan → scenario → audio → ready
  // And LLM + TTS + storage adapters are all invoked
  it('Scenario: nominal — phases progress through plan → scenario → audio → ready', async () => {
    await buildWorker().run({ userId: 'user-1', projectId: 'p-1' });

    expect(phaseHistory.map((h) => h.phase)).toEqual([
      GenerationPhase.Plan,
      GenerationPhase.Scenario,
      GenerationPhase.Audio,
      GenerationPhase.Ready,
    ]);
    expect(phaseHistory.at(-1)?.progress).toBe(1);
    expect(llmService.generateChapterPlan).toHaveBeenCalledOnce();
    expect(llmService.generateChapterScript).toHaveBeenCalled();
    expect(ttsService.synthesizeChapter).toHaveBeenCalled();
    expect(audioStorage.upload).toHaveBeenCalled();
    expect(statusRepository.setError).not.toHaveBeenCalled();
  });

  // Scenario: Error mid-chain (scenario step fails)
  // Given the LLM returns an error during script generation
  // When the worker runs the unified pipeline
  // Then audio step is never reached
  // And status is set to error with the message
  it('Scenario: error mid-chain — scenario fails, audio is skipped, status flips to error', async () => {
    vi.mocked(llmService.generateChapterScript).mockRejectedValue(
      new Error('LLM rate limit'),
    );

    await expect(
      buildWorker().run({ userId: 'user-1', projectId: 'p-1' }),
    ).rejects.toThrow('LLM rate limit');

    expect(phaseHistory.map((h) => h.phase)).toEqual([
      GenerationPhase.Plan,
      GenerationPhase.Scenario,
    ]);
    expect(ttsService.synthesizeChapter).not.toHaveBeenCalled();
    expect(audioStorage.upload).not.toHaveBeenCalled();
    expect(statusRepository.setError).toHaveBeenCalledWith('p-1', 'LLM rate limit');
  });
});
