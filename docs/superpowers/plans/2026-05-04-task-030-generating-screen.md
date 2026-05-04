# TASK-030 — GeneratingScreen mobile (plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Brancher le mobile sur le pipeline `/generate-full` (TASK-035) avec un écran `GeneratingScreen` redessiné (cœur vibrant 3 anneaux + label de phase + retry sur erreur), et passer le `tone` du projet en route param pour teinter le fond.

**Architecture:** Enqueue côté Compose (dans `useComposeFlow.submit()`), polling 2 s côté `GeneratingScreen` (via `useInterval` + `useGenerationStatus`), animations `Animated` natif RN. La phase backend pilote l'UI via un mapping local. Sur `ready` → `navigate.replace('Player')`. Sur `error` → bulle danger + bouton Réessayer (re-POST `/generate-full`).

**Tech Stack:** React Native + Expo, Jest + RNTL, `Animated` natif (pas Reanimated pour ce job), `apiGet`/`apiPost` existants (`shared/services/api.ts`), enum `GenerationPhase` de `@zeste/shared`.

**Spec source:** `docs/superpowers/specs/2026-05-04-task-030-generating-screen-design.md`

**File map:**

| Action | Path | Responsibility |
|---|---|---|
| Create | `apps/mobile/src/shared/hooks/useInterval.ts` | Hook générique `setInterval` pausable |
| Create | `apps/mobile/src/shared/hooks/useInterval.test.ts` | Tests fake timers |
| Create | `apps/mobile/src/shared/hooks/index.ts` | Barrel export |
| Create | `apps/mobile/src/features/compose/hooks/useGenerationStatus.ts` | Polling 2 s sur `/generation-status` + retry |
| Create | `apps/mobile/src/features/compose/hooks/useGenerationStatus.test.ts` | Tests polling/retry |
| Modify | `apps/mobile/src/features/compose/hooks/useComposeFlow.ts` | `submit()` enchaîne `/configure` puis `/generate-full`, retourne `{projectId, tone}` |
| Modify | `apps/mobile/src/features/compose/hooks/useComposeFlow.test.ts` | Couvre nouveau call + retour |
| Modify | `apps/mobile/src/features/compose/screens/ComposeScreen.tsx` | Navigue vers `Generating` avec `{projectId, tone}` |
| Modify | `apps/mobile/src/features/compose/screens/ComposeScreen.test.tsx` | Vérifie nouveau navigate payload |
| Modify | `apps/mobile/src/features/project/screens/LibraryScreen.tsx` | Navigue vers `Generating` avec `{projectId, tone}` |
| Create | `apps/mobile/src/features/compose/components/PulsingRing.tsx` | Sous-composant anneau animé local |
| Rewrite | `apps/mobile/src/features/compose/screens/GeneratingScreen.tsx` | Écran cœur vibrant + polling + erreur/retry |
| Create | `apps/mobile/src/features/compose/screens/GeneratingScreen.test.tsx` | Tests render par phase, navigation, retry |

**Notes pour l'exécutant :**

- TDD strict (RED → GREEN → REFACTOR). Un test à la fois.
- 1 commit par task ; format `feat(scope): titre court` puis paragraphe + `TASK-030`.
- Lint mobile **zéro warning** (`pnpm --filter @zeste/mobile lint --max-warnings 0`). Patterns connus : voir `.context/dialogue-redesign-status.md` (catch err, mocks nav typés).
- Tests mobile : `pnpm --filter @zeste/mobile test` (Jest, depuis racine). Pre-commit hook lance `turbo run test` sur tout (≈ 8 s).
- Le risque "tone manquant côté Library" identifié dans la spec est **résolu** : `Project` shared expose déjà `tone: Tone` (cf. `packages/shared/src/types/project.ts`) et `LibraryScreen` l'utilise déjà via `safeTone(item.tone)`. On réutilise cette même fonction au moment du `navigate`.

---

## Task 1: Hook `useInterval`

**Files:**
- Create: `apps/mobile/src/shared/hooks/useInterval.ts`
- Test: `apps/mobile/src/shared/hooks/useInterval.test.ts`
- Create: `apps/mobile/src/shared/hooks/index.ts`

- [ ] **Step 1.1: Write the failing test**

Create `apps/mobile/src/shared/hooks/useInterval.test.ts`:

```ts
import { renderHook } from '@testing-library/react-native';
import { useInterval } from './useInterval';

describe('useInterval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('calls the callback at every tick', () => {
    const cb = jest.fn();
    renderHook(() => useInterval(cb, 1000));

    expect(cb).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('does not call the callback when delay is null', () => {
    const cb = jest.fn();
    renderHook(() => useInterval(cb, null));

    jest.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('clears the interval on unmount', () => {
    const cb = jest.fn();
    const { unmount } = renderHook(() => useInterval(cb, 1000));

    jest.advanceTimersByTime(1000);
    expect(cb).toHaveBeenCalledTimes(1);

    unmount();
    jest.advanceTimersByTime(5000);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('uses the latest callback without resetting the interval', () => {
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    const { rerender } = renderHook(({ fn }: { fn: () => void }) => useInterval(fn, 1000), {
      initialProps: { fn: cb1 },
    });

    jest.advanceTimersByTime(1000);
    expect(cb1).toHaveBeenCalledTimes(1);

    rerender({ fn: cb2 });
    jest.advanceTimersByTime(1000);

    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 1.2: Run tests to verify RED**

```bash
cd /Users/romualdpiquet/conductor/workspaces/zeste/singapore-v1/apps/mobile
pnpm test -- useInterval
```

Expected: FAIL — `Cannot find module './useInterval'`.

- [ ] **Step 1.3: Implement minimal hook**

Create `apps/mobile/src/shared/hooks/useInterval.ts`:

```ts
import { useEffect, useRef } from 'react';

export function useInterval(callback: () => void, delayMs: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return undefined;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
```

Create `apps/mobile/src/shared/hooks/index.ts`:

```ts
export { useInterval } from './useInterval';
```

- [ ] **Step 1.4: Run tests to verify GREEN**

```bash
pnpm test -- useInterval
```

Expected: 4 tests pass.

- [ ] **Step 1.5: Lint check**

```bash
pnpm lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 1.6: Commit**

```bash
git add apps/mobile/src/shared/hooks/
git commit -m "$(cat <<'EOF'
feat(mobile): hook useInterval pausable

Hook générique avec ref interne pour conserver la callback à jour sans
re-créer l'interval. Pause via delay=null. Cleanup à l'unmount.

TASK-030
EOF
)"
```

---

## Task 2: Hook `useGenerationStatus`

**Files:**
- Create: `apps/mobile/src/features/compose/hooks/useGenerationStatus.ts`
- Test: `apps/mobile/src/features/compose/hooks/useGenerationStatus.test.ts`

- [ ] **Step 2.1: Write the failing test**

Create `apps/mobile/src/features/compose/hooks/useGenerationStatus.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as api from '../../../shared/services/api';
import { useGenerationStatus } from './useGenerationStatus';

jest.mock('../../../shared/services/api');
const mockedGet = api.apiGet as jest.Mock;
const mockedPost = api.apiPost as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useGenerationStatus', () => {
  it('fetches the status immediately on mount', async () => {
    mockedGet.mockResolvedValue({ phase: 'plan', progress: 0, error: null });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith('/api/projects/p-1/generation-status');
      expect(result.current.status.phase).toBe('plan');
    });
  });

  it('polls every 2 seconds while phase is not terminal', async () => {
    mockedGet
      .mockResolvedValueOnce({ phase: 'plan', progress: 0, error: null })
      .mockResolvedValueOnce({ phase: 'scenario', progress: 0.33, error: null });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => expect(result.current.status.phase).toBe('plan'));

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => expect(result.current.status.phase).toBe('scenario'));
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });

  it('stops polling when phase becomes ready', async () => {
    mockedGet.mockResolvedValueOnce({ phase: 'ready', progress: 1, error: null });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => expect(result.current.status.phase).toBe('ready'));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockedGet).toHaveBeenCalledTimes(1);
  });

  it('stops polling when phase becomes error', async () => {
    mockedGet.mockResolvedValueOnce({ phase: 'error', progress: 0, error: 'Mistral down' });

    const { result } = renderHook(() => useGenerationStatus('p-1'));

    await waitFor(() => expect(result.current.status.phase).toBe('error'));

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(result.current.status.error).toBe('Mistral down');
  });

  it('retry() re-POSTs /generate-full and resumes polling', async () => {
    mockedGet
      .mockResolvedValueOnce({ phase: 'error', progress: 0, error: 'boom' })
      .mockResolvedValueOnce({ phase: 'plan', progress: 0, error: null });
    mockedPost.mockResolvedValueOnce({ jobId: 'job-2' });

    const { result } = renderHook(() => useGenerationStatus('p-1'));
    await waitFor(() => expect(result.current.status.phase).toBe('error'));

    await act(async () => {
      await result.current.retry();
    });

    expect(mockedPost).toHaveBeenCalledWith('/api/projects/p-1/generate-full');
    await waitFor(() => expect(result.current.status.phase).toBe('plan'));
  });
});
```

- [ ] **Step 2.2: Run tests to verify RED**

```bash
pnpm test -- useGenerationStatus
```

Expected: FAIL — `Cannot find module './useGenerationStatus'`.

- [ ] **Step 2.3: Implement the hook**

Create `apps/mobile/src/features/compose/hooks/useGenerationStatus.ts`:

```ts
import { useCallback, useEffect, useState } from 'react';
import { GenerationPhase } from '@zeste/shared';
import { apiGet, apiPost } from '../../../shared/services/api';
import { useInterval } from '../../../shared/hooks';

export interface GenerationStatusState {
  phase: GenerationPhase;
  progress: number;
  error: string | null;
}

export interface UseGenerationStatus {
  status: GenerationStatusState;
  retry: () => Promise<void>;
}

const POLL_INTERVAL_MS = 2000;
const INITIAL: GenerationStatusState = {
  phase: GenerationPhase.Idle,
  progress: 0,
  error: null,
};

function isTerminal(phase: GenerationPhase): boolean {
  return phase === GenerationPhase.Ready || phase === GenerationPhase.Error;
}

export function useGenerationStatus(projectId: string): UseGenerationStatus {
  const [status, setStatus] = useState<GenerationStatusState>(INITIAL);

  const fetchStatus = useCallback(async () => {
    try {
      const next = await apiGet<GenerationStatusState>(
        `/api/projects/${projectId}/generation-status`,
      );
      setStatus(next);
    } catch (err) {
      setStatus({
        phase: GenerationPhase.Error,
        progress: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [projectId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const delay = isTerminal(status.phase) ? null : POLL_INTERVAL_MS;
  useInterval(fetchStatus, delay);

  const retry = useCallback(async () => {
    await apiPost(`/api/projects/${projectId}/generate-full`);
    setStatus({ phase: GenerationPhase.Plan, progress: 0, error: null });
    await fetchStatus();
  }, [projectId, fetchStatus]);

  return { status, retry };
}
```

- [ ] **Step 2.4: Run tests to verify GREEN**

```bash
pnpm test -- useGenerationStatus
```

Expected: 5 tests pass.

- [ ] **Step 2.5: Lint check**

```bash
pnpm lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 2.6: Commit**

```bash
git add apps/mobile/src/features/compose/hooks/useGenerationStatus.ts apps/mobile/src/features/compose/hooks/useGenerationStatus.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile): hook useGenerationStatus polling 2s

Polling immédiat au mount + tick 2s tant que phase ∉ {ready, error}.
retry() re-POST /generate-full et relance le polling. Stop auto sur
phase terminale.

TASK-030
EOF
)"
```

---

## Task 3: `useComposeFlow.submit()` — chaîner `/configure` puis `/generate-full`

**Files:**
- Modify: `apps/mobile/src/features/compose/hooks/useComposeFlow.ts`
- Modify: `apps/mobile/src/features/compose/hooks/useComposeFlow.test.ts`

- [ ] **Step 3.1: Update existing test for `submit()` success path**

In `useComposeFlow.test.ts`, locate the test `submits PATCH /configure with chapterCount=1 when chapters is null` and update its assertions to match the new contract: `submit()` now also calls `apiPost('/api/projects/p-1/generate-full')` and returns `{ projectId, tone }`.

Replace that test entirely with:

```ts
  it('submits PATCH /configure then POST /generate-full and returns {projectId, tone}', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });
    mockedPatch.mockResolvedValueOnce({ id: 'p-1' });
    mockedPost.mockResolvedValueOnce({ jobId: 'job-1' });

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });
    act(() => {
      result.current.advanceToTone();
      result.current.selectTone('pedagogue');
      result.current.setDuration(12);
      result.current.setChapters(null);
    });

    let outcome: Awaited<ReturnType<typeof result.current.submit>> = null;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(mockedPatch).toHaveBeenCalledWith('/api/projects/p-1/configure', {
      tone: 'pedagogue',
      targetDuration: 12,
      chapterCount: 1,
    });
    expect(mockedPost).toHaveBeenLastCalledWith('/api/projects/p-1/generate-full');
    expect(outcome).toEqual({ projectId: 'p-1', tone: 'pedagogue' });

    await waitFor(() => expect(result.current.phase).toBe('ready'));
  });
```

- [ ] **Step 3.2: Add a test for `submit()` failing on `/generate-full`**

Add this new test right after the previous one:

```ts
  it('returns null and surfaces the error when /generate-full fails', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });
    mockedPatch.mockResolvedValueOnce({ id: 'p-1' });
    mockedPost.mockRejectedValueOnce(new Error('Quota exceeded'));

    const { result } = renderHook(() => useComposeFlow());

    await act(async () => {
      await result.current.submitName('X');
    });
    await act(async () => {
      await result.current.addSource({ type: 'url', value: 'https://x.fr' });
    });
    act(() => {
      result.current.advanceToTone();
      result.current.selectTone('debate');
    });

    let outcome: Awaited<ReturnType<typeof result.current.submit>> = null;
    await act(async () => {
      outcome = await result.current.submit();
    });

    expect(outcome).toBeNull();
    expect(result.current.error).toBe('Quota exceeded');
    expect(result.current.phase).toBe('duration');
  });
```

- [ ] **Step 3.3: Run tests to verify RED**

```bash
pnpm test -- useComposeFlow
```

Expected: 2 tests fail (the updated one expects `tone` in the returned object and the new `/generate-full` call).

- [ ] **Step 3.4: Implement the changes**

In `apps/mobile/src/features/compose/hooks/useComposeFlow.ts`:

Update the `UseComposeFlow` interface:

```ts
  submit: () => Promise<{ projectId: string; tone: ToneId } | null>;
```

Replace the `submit` callback body with:

```ts
  const submit = useCallback(async (): Promise<{ projectId: string; tone: ToneId } | null> => {
    if (!projectId || !tone) return null;

    setLoading(true);
    setError(null);
    try {
      await apiPatch(`/api/projects/${projectId}/configure`, {
        tone,
        targetDuration: duration,
        chapterCount: chapters ?? 1,
      });
      await apiPost(`/api/projects/${projectId}/generate-full`);
      setPhase('ready');
      return { projectId, tone };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [projectId, tone, duration, chapters]);
```

- [ ] **Step 3.5: Run tests to verify GREEN**

```bash
pnpm test -- useComposeFlow
```

Expected: all `useComposeFlow` tests pass (including the previous "returns null and surfaces the error when submit fails" — the rejection on `apiPatch` still triggers the catch).

- [ ] **Step 3.6: Lint check**

```bash
pnpm lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 3.7: Commit**

```bash
git add apps/mobile/src/features/compose/hooks/useComposeFlow.ts apps/mobile/src/features/compose/hooks/useComposeFlow.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile): submit() enchaîne /configure puis /generate-full

useComposeFlow.submit() poste /generate-full après /configure et retourne
{projectId, tone} pour permettre au navigate vers Generating de teinter
le fond avec la palette du tone choisi.

TASK-030
EOF
)"
```

---

## Task 4: `ComposeScreen` — naviguer avec `{projectId, tone}`

**Files:**
- Modify: `apps/mobile/src/features/compose/screens/ComposeScreen.tsx`
- Modify: `apps/mobile/src/features/compose/screens/ComposeScreen.test.tsx`

- [ ] **Step 4.1: Update existing test**

In `ComposeScreen.test.tsx`, replace the assertions block at the end of the test `navigates to Generating after the user submits the configuration` with:

```ts
    await waitFor(() => {
      expect(api.apiPatch).toHaveBeenCalledWith(
        '/api/projects/p-1/configure',
        expect.objectContaining({ tone: 'pedagogue' }),
      );
      expect(api.apiPost).toHaveBeenLastCalledWith('/api/projects/p-1/generate-full');
      expect(navigation.navigate).toHaveBeenCalledWith('Generating', {
        projectId: 'p-1',
        tone: 'pedagogue',
      });
    });
```

Also update the test setup so that the `mockedPost` chain handles the `/generate-full` call. Right above this `waitFor`, before the `fireEvent.press(await findByTestId('compose-launch'))`, add:

```ts
    mockedPost.mockResolvedValueOnce({ jobId: 'job-1' });
```

- [ ] **Step 4.2: Run test to verify RED**

```bash
pnpm test -- ComposeScreen
```

Expected: FAIL — navigate called with `{ projectId: 'p-1' }` (no `tone`).

- [ ] **Step 4.3: Update `ComposeScreen.onLaunch`**

In `apps/mobile/src/features/compose/screens/ComposeScreen.tsx`, replace `onLaunch`:

```ts
  const onLaunch = async () => {
    const result = await flow.submit();
    if (result) {
      navigation.navigate('Generating', {
        projectId: result.projectId,
        tone: result.tone,
      });
    }
  };
```

- [ ] **Step 4.4: Run test to verify GREEN**

```bash
pnpm test -- ComposeScreen
```

Expected: all `ComposeScreen` tests pass.

- [ ] **Step 4.5: Commit**

```bash
git add apps/mobile/src/features/compose/screens/ComposeScreen.tsx apps/mobile/src/features/compose/screens/ComposeScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): ComposeScreen passe le tone à Generating

Le navigate vers Generating inclut maintenant le tone du projet pour que
GeneratingScreen puisse teinter le fond avec la palette correspondante.

TASK-030
EOF
)"
```

---

## Task 5: `LibraryScreen` — passer le `tone` à `Generating`

**Files:**
- Modify: `apps/mobile/src/features/project/screens/LibraryScreen.tsx`

- [ ] **Step 5.1: Update `goToProject`**

In `apps/mobile/src/features/project/screens/LibraryScreen.tsx`, replace `goToProject`:

```ts
  const goToProject = (project: Project) => {
    if (project.status === 'ready') {
      navigation.navigate('Player', { projectId: project.id });
    } else if (project.status === 'processing') {
      navigation.navigate('Generating', {
        projectId: project.id,
        tone: safeTone(project.tone),
      });
    } else {
      navigation.navigate('Compose', { projectId: project.id });
    }
  };
```

(`safeTone` already exists in this file with the correct fallback behavior.)

- [ ] **Step 5.2: Run library tests to confirm no regression**

```bash
pnpm test -- LibraryScreen
```

Expected: all existing tests pass (none assert on the `Generating` navigate payload today, but they exercise the file structure).

- [ ] **Step 5.3: Lint check**

```bash
pnpm lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 5.4: Commit**

```bash
git add apps/mobile/src/features/project/screens/LibraryScreen.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): LibraryScreen passe le tone à Generating

Quand un projet processing est ouvert depuis la bibliothèque,
GeneratingScreen reçoit le tone pour teinter le fond.

TASK-030
EOF
)"
```

---

## Task 6: Composant `PulsingRing`

**Files:**
- Create: `apps/mobile/src/features/compose/components/PulsingRing.tsx`

> Pas de test unitaire dédié pour ce composant : il est purement visuel (Animated.loop). Il sera couvert indirectement par `GeneratingScreen.test.tsx` (rendu sans crash + style backgroundColor du parent). Justifié par YAGNI : tester un loop d'animation natif n'apporte pas de valeur de régression.

- [ ] **Step 6.1: Create the component**

Create `apps/mobile/src/features/compose/components/PulsingRing.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';

interface PulsingRingProps {
  delayMs: number;
  toneInk: string;
  size?: number;
  testID?: string;
}

const DURATION_MS = 2400;

export function PulsingRing({ delayMs, toneInk, size = 200, testID }: PulsingRingProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(progress, {
          toValue: 1,
          duration: DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delayMs, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });

  return (
    <Animated.View
      testID={testID}
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: toneInk,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
```

- [ ] **Step 6.2: Typecheck**

```bash
cd /Users/romualdpiquet/conductor/workspaces/zeste/singapore-v1
pnpm --filter @zeste/mobile typecheck
```

Expected: no errors.

- [ ] **Step 6.3: Lint check**

```bash
pnpm --filter @zeste/mobile lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 6.4: Commit**

```bash
git add apps/mobile/src/features/compose/components/PulsingRing.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): composant PulsingRing animé

Anneau circulaire scale 0.8→1.4 + opacity 0.4→0 en boucle 2400ms
avec délai initial. Animated natif, useNativeDriver. Sera composé
par 3 dans GeneratingScreen avec délais 0/800/1600ms.

TASK-030
EOF
)"
```

---

## Task 7: `GeneratingScreen` — refonte complète

**Files:**
- Rewrite: `apps/mobile/src/features/compose/screens/GeneratingScreen.tsx`
- Create: `apps/mobile/src/features/compose/screens/GeneratingScreen.test.tsx`

- [ ] **Step 7.1: Write the failing test**

Create `apps/mobile/src/features/compose/screens/GeneratingScreen.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { GeneratingScreen } from './GeneratingScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');
const mockedGet = api.apiGet as jest.Mock;
const mockedPost = api.apiPost as jest.Mock;

function makeProps(overrides: Partial<{ tone: string }> = {}) {
  const navigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };
  const route = {
    params: { projectId: 'p-1', tone: overrides.tone ?? 'pedagogue' },
  };
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigation: navigation as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    route: route as any,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GeneratingScreen', () => {
  it('shows the plan label while phase=plan', async () => {
    mockedGet.mockResolvedValue({ phase: 'plan', progress: 0, error: null });
    const props = makeProps();

    const { findByText } = render(<GeneratingScreen {...props} />);

    await findByText(/On structure le/i);
  });

  it('shows the scenario label while phase=scenario', async () => {
    mockedGet.mockResolvedValue({ phase: 'scenario', progress: 0.33, error: null });
    const props = makeProps();

    const { findByText } = render(<GeneratingScreen {...props} />);

    await findByText(/On écrit le/i);
  });

  it('shows the audio label while phase=audio', async () => {
    mockedGet.mockResolvedValue({ phase: 'audio', progress: 0.66, error: null });
    const props = makeProps();

    const { findByText } = render(<GeneratingScreen {...props} />);

    await findByText(/On enregistre les/i);
  });

  it('navigates to Player when phase becomes ready', async () => {
    mockedGet.mockResolvedValue({ phase: 'ready', progress: 1, error: null });
    const props = makeProps();

    render(<GeneratingScreen {...props} />);

    await waitFor(() => {
      expect(props.navigation.replace).toHaveBeenCalledWith('Player', { projectId: 'p-1' });
    });
  });

  it('shows an error bubble and a retry button when phase=error', async () => {
    mockedGet.mockResolvedValue({ phase: 'error', progress: 0, error: 'Mistral timeout' });
    const props = makeProps();

    const { findByText, findByTestId } = render(<GeneratingScreen {...props} />);

    await findByText(/Mistral timeout/i);
    await findByTestId('generating-retry');
  });

  it('reposts /generate-full when retry is tapped', async () => {
    mockedGet.mockResolvedValueOnce({ phase: 'error', progress: 0, error: 'boom' });
    mockedPost.mockResolvedValueOnce({ jobId: 'job-2' });
    mockedGet.mockResolvedValueOnce({ phase: 'plan', progress: 0, error: null });
    const props = makeProps();

    const { findByTestId } = render(<GeneratingScreen {...props} />);

    fireEvent.press(await findByTestId('generating-retry'));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/api/projects/p-1/generate-full');
    });
  });

  it('navigates back to Library when "Continuer en arrière-plan" is tapped', async () => {
    mockedGet.mockResolvedValue({ phase: 'plan', progress: 0, error: null });
    const props = makeProps();

    const { findByTestId } = render(<GeneratingScreen {...props} />);

    fireEvent.press(await findByTestId('generating-background'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('Library');
  });
});
```

- [ ] **Step 7.2: Run test to verify RED**

```bash
pnpm test -- GeneratingScreen
```

Expected: FAIL — current stub doesn't match (no plan/scenario/audio labels, no retry, no replace call, etc.).

- [ ] **Step 7.3: Rewrite `GeneratingScreen.tsx`**

Replace the contents of `apps/mobile/src/features/compose/screens/GeneratingScreen.tsx`:

```tsx
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GenerationPhase } from '@zeste/shared';
import { Bubble, Button } from '../../../shared/components';
import { color, space, tone, type, ToneId } from '../../../shared/theme';
import { useGenerationStatus } from '../hooks/useGenerationStatus';
import { PulsingRing } from '../components/PulsingRing';

interface GeneratingScreenProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  route: any;
}

const VALID_TONES: ToneId[] = ['pedagogue', 'debate', 'vulgarization', 'interview'];

function safeTone(value: unknown): ToneId {
  if (typeof value === 'string' && (VALID_TONES as string[]).includes(value)) {
    return value as ToneId;
  }
  return 'pedagogue';
}

function initialFor(t: ToneId): string {
  return tone[t].label.charAt(0).toUpperCase();
}

export function GeneratingScreen({ navigation, route }: GeneratingScreenProps) {
  const projectId: string = route?.params?.projectId ?? '';
  const toneId = safeTone(route?.params?.tone);
  const palette = tone[toneId];

  const { status, retry } = useGenerationStatus(projectId);

  useEffect(() => {
    if (status.phase === GenerationPhase.Ready) {
      navigation.replace('Player', { projectId });
    }
  }, [status.phase, navigation, projectId]);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <View style={styles.heart}>
        <PulsingRing delayMs={0} toneInk={palette.ink} testID="generating-ring-1" />
        <PulsingRing delayMs={800} toneInk={palette.ink} testID="generating-ring-2" />
        <PulsingRing delayMs={1600} toneInk={palette.ink} testID="generating-ring-3" />
        <Text style={[styles.glyph, type.serif, { color: palette.ink }]}>
          {initialFor(toneId)}
        </Text>
      </View>

      <View style={styles.body}>
        {status.phase === GenerationPhase.Error ? (
          <ErrorBlock message={status.error} onRetry={retry} />
        ) : (
          <PhaseLabel phase={status.phase} ink={palette.ink} />
        )}
      </View>

      <View style={styles.footer}>
        <Button
          variant="secondary"
          label="Continuer en arrière-plan"
          onPress={() => navigation.navigate('Library')}
          testID="generating-background"
        />
      </View>
    </View>
  );
}

function PhaseLabel({ phase, ink }: { phase: GenerationPhase; ink: string }) {
  if (phase === GenerationPhase.Plan) {
    return (
      <Text style={[styles.label, { color: ink }]}>
        On structure le <Text style={[styles.label, type.serif, { color: ink }]}>plan</Text>…
      </Text>
    );
  }
  if (phase === GenerationPhase.Scenario) {
    return (
      <Text style={[styles.label, { color: ink }]}>
        On écrit le <Text style={[styles.label, type.serif, { color: ink }]}>dialogue</Text>…
      </Text>
    );
  }
  if (phase === GenerationPhase.Audio) {
    return (
      <Text style={[styles.label, { color: ink }]}>
        On enregistre les <Text style={[styles.label, type.serif, { color: ink }]}>voix</Text>…
      </Text>
    );
  }
  return <Text style={[styles.label, { color: ink }]}>On démarre…</Text>;
}

function ErrorBlock({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => Promise<void>;
}) {
  return (
    <View style={styles.errorBlock}>
      <Bubble from="app" tone="danger">
        {message ?? 'Une erreur est survenue.'}
      </Bubble>
      <Button label="Réessayer" onPress={onRetry} testID="generating-retry" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.xl,
    paddingVertical: space['2xl'],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heart: {
    flex: 1,
    width: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 96,
    lineHeight: 110,
  },
  body: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: type.label.fontSize,
    fontWeight: type.label.fontWeight,
    textAlign: 'center',
  },
  errorBlock: {
    width: '100%',
    gap: space.md,
    alignItems: 'center',
  },
  footer: {
    paddingTop: space.lg,
    width: '100%',
  },
});
```

> Note : si `<Bubble from="app" tone="danger">` n'accepte pas la prop `tone`, retomber sur `<Bubble from="app">{message}</Bubble>` enveloppé d'un `View` avec `borderColor: color.danger` (style `errorBox` du `ComposeScreen` est un précédent valide). Vérifier l'API de `Bubble` au moment de l'implémentation et adapter la prop ou enlever la prop `tone`.

- [ ] **Step 7.4: Verify the `Bubble` prop and adapt if needed**

Read `apps/mobile/src/shared/components/Bubble.tsx`. If it does **not** support a `tone` prop (or equivalent), replace `<Bubble from="app" tone="danger">{message ?? '…'}</Bubble>` with:

```tsx
<View style={localErrorBox}>
  <Text style={localErrorText}>{message ?? 'Une erreur est survenue.'}</Text>
</View>
```

…and add the corresponding styles using `color.danger` for `borderColor` and color (mirror the `errorBox` pattern from `ComposeScreen.tsx:432-443`).

- [ ] **Step 7.5: Run test to verify GREEN**

```bash
pnpm test -- GeneratingScreen
```

Expected: 7 tests pass.

- [ ] **Step 7.6: Lint check**

```bash
pnpm lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 7.7: Typecheck**

```bash
pnpm --filter @zeste/mobile typecheck
```

Expected: no errors.

- [ ] **Step 7.8: Commit**

```bash
git add apps/mobile/src/features/compose/screens/GeneratingScreen.tsx apps/mobile/src/features/compose/screens/GeneratingScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): GeneratingScreen cœur vibrant + polling /generation-status

Refonte complète : fond teinté par tone, 3 PulsingRing concentriques
animés, glyph initiale Georgia 96px au centre, label de phase mappé sur
GenerationPhase. Polling 2s via useGenerationStatus, navigate replace
vers Player sur ready, état erreur avec bulle danger + Réessayer
(re-POST /generate-full), bouton secondaire "Continuer en arrière-plan"
qui ramène à Library.

TASK-030
EOF
)"
```

---

## Task 8: Vérification globale

**Files:** none (validation seulement).

- [ ] **Step 8.1: Run the full test suite**

```bash
cd /Users/romualdpiquet/conductor/workspaces/zeste/singapore-v1
pnpm turbo run test
```

Expected: tous les tests verts (mobile, api, domain, shared, web). Comparer au baseline `dialogue-redesign-status.md` (435 tests verts) ; on devrait être à 435 + (4 useInterval + 5 useGenerationStatus + 7 GeneratingScreen + 1 nouveau cas useComposeFlow) ≈ 452.

- [ ] **Step 8.2: Lint mobile**

```bash
pnpm --filter @zeste/mobile lint --max-warnings 0
```

Expected: zero warning.

- [ ] **Step 8.3: Typecheck monorepo**

```bash
pnpm turbo run typecheck
```

Expected: no errors.

- [ ] **Step 8.4: Update handoff**

Edit `.context/dialogue-redesign-status.md` :
- Ligne TASK-030 : `⏸️` → `✅`, ajouter le commit hash de Task 7 et la note "branche /generate-full + polling 2s + retry + bouton arrière-plan, animations Animated natif".
- Mettre à jour la ligne du tableau "Tests (état actuel)" avec le nouveau total.
- Mettre à jour la dernière section "Comment relancer dans une nouvelle conversation" pour pointer vers la prochaine task naturelle (ex : déploiement / workers prod).

- [ ] **Step 8.5: Commit handoff update**

```bash
git add .context/dialogue-redesign-status.md
git commit -m "$(cat <<'EOF'
chore(handoff): clôt TASK-030 GeneratingScreen

GeneratingScreen branché sur /generate-full + polling
/generation-status. Le redesign mobile est complet côté UI ; restent
les tasks "déploiement / workers prod" hors périmètre redesign.

TASK-030
EOF
)"
```

- [ ] **Step 8.6: E2E manuel (UI)**

Démarrer Redis (`brew services start redis`), l'API (`pnpm --filter @zeste/api dev`) et le mobile (`pnpm --filter @zeste/mobile start`). Vérifier :

1. Compose → choisir un tone → Lancer la génération → on arrive sur Generating teinté avec la palette du tone, 3 anneaux animés, glyph correct.
2. Le label change : « On démarre… » → « On structure le plan… » → « On écrit le dialogue… » → « On enregistre les voix… ».
3. À la fin, on bascule automatiquement sur Player.
4. Tap "Continuer en arrière-plan" → retour Library, le projet est `processing`. Re-tap dessus → on revient sur Generating et le polling reprend.
5. (Optionnel) Forcer une erreur côté API (kill worker en plein scenario) → bulle danger + bouton Réessayer fonctionne.

Si un comportement diverge, ajouter un test de régression et corriger avant de clore.

---

## Self-Review (auteur du plan)

**1. Spec coverage :**
- Critère « `features/compose/screens/GeneratingScreen.tsx` existe » → Task 7
- Critère « Polling 2s sur `GET /generation-status` » → Task 2
- Critère « Phase affichée se met à jour en direct » → Task 7 (label par phase) + Task 2 (polling)
- Critère « Sur `phase === 'ready'` → navigate `Player` » → Task 7 (test 4)
- Critère « Sur `phase === 'error'` → bulle danger + bouton Réessayer » → Task 7 (tests 5, 6)
- Critère « Bouton secondaire "Continuer en arrière-plan" → back `Library` » → Task 7 (test 7)
- Sous-tâche « Animations `bRing` (3 anneaux décalés) » → Task 6 (`Animated` natif au lieu de Reanimated, justifié par le handoff)
- Sous-tâche « Hook `useInterval(fn, ms)` dans `shared/hooks/` » → Task 1
- Sous-tâche « Hook `useGenerationStatus(projectId)` » → Task 2
- Sous-tâche « Remplacer la route `ChapterList` par `Generating` » → **déjà fait** par TASK-029 (cf. handoff). Pas de task dédiée.
- Tests « render par phase » → Task 7 (tests 1, 2, 3 + state idle implicite)
- Tests « navigation auto sur ready » → Task 7 (test 4)
- Plus : Task 3 / Task 4 / Task 5 (passage du `tone` en route param) — pas explicite dans la spec mais nécessaire pour le critère « teinte = palette du ton choisi ».

**2. Placeholder scan :** aucun TBD/TODO. Toutes les étapes contiennent du code complet.

**3. Type consistency :**
- `GenerationPhase` (enum partagé) utilisé partout (Task 2 hook, Task 7 screen).
- `UseGenerationStatus.retry` est `() => Promise<void>` partout.
- `submit()` retourne `{ projectId, tone }` (Task 3), consommé par ComposeScreen (Task 4).
- `safeTone` est défini localement dans Library et redéfini localement dans GeneratingScreen — duplication mineure acceptée pour éviter de créer un util partagé pour deux call sites (YAGNI).

Plan complet.
