# TASK-030 — GeneratingScreen mobile (design)

> Date : 2026-05-04
> Branche : `dialogue-redesign`
> Spec source : `.context/attachments/TASKS.md` §TASK-030, `.context/attachments/SCREENS.md` §5
> Backend prérequis : TASK-035 (déjà mergé)

## Objectif

Brancher le mobile sur le pipeline backend unifié `/generate-full` introduit par TASK-035. L'écran `GeneratingScreen` actuel est un stub `ActivityIndicator` ; on le remplace par le visuel "cœur vibrant" du redesign et on connecte le polling de statut.

## Périmètre

Inclus :

- Hook générique `useInterval`
- Hook `useGenerationStatus(projectId)` qui poll `GET /generation-status` toutes les 2 s
- Refonte de `GeneratingScreen` (cœur vibrant 3 anneaux, label de phase, états error/retry, bouton "Continuer en arrière-plan")
- Modification de `useComposeFlow.submit()` pour enchaîner `PATCH /configure` puis `POST /generate-full`
- Passage du `tone` en route param vers `Generating` (depuis Compose et Library)

Hors scope (follow-ups possibles) :

- Backoff exponentiel sur erreurs réseau
- Reprise partielle au stage qui a échoué (Réessayer relance from scratch)
- Migration WebSocket (déjà mentionnée dans le spec écran)
- Persistance AsyncStorage du flow Compose (puntée par TASK-029)

## Décisions verrouillées

1. **Enqueue côté Compose** : `useComposeFlow.submit()` appelle `POST /generate-full` après le `PATCH /configure`. `GeneratingScreen` ne fait QUE poller. Évite le double-enqueue quand on arrive depuis `LibraryScreen` (projet déjà en `processing`).
2. **Polling simple** : intervalle fixe 2 s, premier appel immédiat, pas de backoff. Stop sur `phase === 'ready' | 'error'` et au blur/unmount.
3. **Réessayer = re-POST `/generate-full`** : le backend accepte, il remet la phase à `plan/0` et relance le worker depuis le début.
4. **Animations en `Animated` natif RN** (pas Reanimated). Cohérent avec la décision verrouillée du handoff `dialogue-redesign-status.md`.
5. **`idle` mappé à « On démarre… »**, `progress` ignoré côté UI (les 3 phases visibles suffisent).

## Architecture

```
apps/mobile/src/
├── shared/hooks/
│   └── useInterval.ts                 [NEW]
├── features/compose/
│   ├── hooks/
│   │   ├── useComposeFlow.ts          [MODIFIED]
│   │   └── useGenerationStatus.ts     [NEW]
│   └── screens/
│       └── GeneratingScreen.tsx       [REWRITE]
```

## Data flow

```
ComposeScreen.onLaunch
  └─ useComposeFlow.submit()
        ├─ PATCH /api/projects/:id/configure
        ├─ POST  /api/projects/:id/generate-full     [NEW]
        └─ return { projectId, tone }

ComposeScreen
  └─ navigation.navigate('Generating', { projectId, tone })

GeneratingScreen (mount)
  └─ useGenerationStatus(projectId)
        ├─ premier apiGet immédiat
        └─ useInterval(2000) → apiGet
  └─ effects :
        phase === 'ready' → navigation.replace('Player', { projectId })
        phase === 'error' → render état erreur (polling stoppé)
        blur / unmount    → polling stoppé
```

## Contrats

### `useInterval(callback, delayMs | null)`

- Appelle `callback` toutes les `delayMs` ms.
- `delay === null` met l'interval en pause.
- Stoppe à l'unmount.
- Le callback est conservé dans une `ref` (pas de re-création de l'interval quand la closure change).

### `useGenerationStatus(projectId)`

```ts
type GenerationStatusState = {
  phase: GenerationPhase;          // 'idle' | 'plan' | 'scenario' | 'audio' | 'ready' | 'error'
  progress: number;                // 0..1
  error: string | null;
};

type UseGenerationStatus = {
  status: GenerationStatusState;
  retry: () => Promise<void>;      // re-POST /generate-full puis reset
};
```

- Fetch immédiat au mount, puis tick 2 s tant que `phase ∉ {ready, error}`.
- `retry()` : appelle `POST /api/projects/:id/generate-full`, remet le polling actif, reset `error` local éventuel.

### `useComposeFlow.submit()` (modifié)

- Avant : `PATCH /configure` puis `setPhase('ready')` puis return `{ projectId }`.
- Après : `PATCH /configure` puis `POST /generate-full` puis `setPhase('ready')` puis return `{ projectId, tone }`.
- Erreur : si `POST /generate-full` échoue, `error` est setté, return `null` (comme actuel).

### Route params

`Generating` : `{ projectId: string; tone: ToneId }`. ComposeScreen et LibraryScreen passent les deux.

## UI

- Fond plein écran : `tone[paramTone].bg`
- Centre vertical : 3 `<PulsingRing>` superposés (delays 0 / 800 / 1600 ms)
- Au centre du cœur : initiale du tone (`P` / `D` / `V` / `I`) en `type.serif` 96 px, couleur `tone.ink`
- Sous le cœur, `type.label`, color `tone.ink` :
  - `idle` → « On démarre… »
  - `plan` → « On structure le *plan*… » (mot italic Georgia)
  - `scenario` → « On écrit le *dialogue*… »
  - `audio` → « On enregistre les *voix*… »
- État erreur : `<Bubble from="app">` (variant danger via `color.danger`) + `<Button label="Réessayer">`
- Bottom : `<Button variant="secondary" label="Continuer en arrière-plan">` → `navigation.navigate('Library')`

### Sous-composant `<PulsingRing delay toneInk />`

- `Animated.View` cercle 200 px, `borderColor: toneInk + alpha 0.2`, `borderWidth: 2`.
- Loop scale 0.8 → 1.4 + opacity 0.4 → 0 sur 2400 ms, ease-out.
- `useNativeDriver: true`.
- Démarre après `Animated.delay(delay)` au mount.

## Tests

### `useInterval.test.ts` (Jest fake timers)

- Appelle le callback à chaque tick
- Stoppe à l'unmount
- Stoppe quand `delay === null`
- Pas de double appel quand le callback change

### `useGenerationStatus.test.ts`

- Premier fetch immédiat (mock `apiGet`)
- Tick suivant à 2 s
- Stoppe à `phase === 'ready'`
- Stoppe à `phase === 'error'`
- `retry()` appelle `apiPost('/generate-full')` puis relance le polling

### `GeneratingScreen.test.tsx`

- Render selon phase (idle / plan / scenario / audio) — label affiché correspond
- Phase `ready` → `navigation.replace('Player', { projectId })` appelé
- Phase `error` → bulle danger visible + bouton Réessayer
- Tap Réessayer → `apiPost` appelé sur `/generate-full`
- Tap "Continuer en arrière-plan" → `navigation.navigate('Library')` appelé
- Fond `tone[paramTone].bg`

### `useComposeFlow.test.ts` (modifié)

- `submit()` appelle `apiPatch('/configure')` PUIS `apiPost('/generate-full')` dans cet ordre
- Retourne `{ projectId, tone }`
- Si `apiPost('/generate-full')` rejette → return `null`, error set

## Routing

`RootNavigator` : pas de changement structurel, route `Generating` existe déjà. Les params route deviennent `{ projectId, tone }`.

`LibraryScreen.navigate('Generating', …)` actuel passe seulement `{ projectId }`. À étendre à `{ projectId, tone: project.tone }`. Pré-requis : que le DTO `Project` côté mobile expose `tone`. Vérifier en cours d'implémentation et ajuster (l'API mobile doit renvoyer ce champ ; si absent, fallback sur un tone neutre — à valider).

## Risque connu

`project.tone` peut ne pas être exposé dans le DTO `Project` côté mobile aujourd'hui. À vérifier au début de l'implémentation. Si le champ manque, deux options :

- Étendre le serializer route `/projects` pour inclure `tone` (préférable, cohérent avec les bugs identifiés dans `MEMORY.md` sur les serializers incomplets)
- Fallback `'pedagogue'` si absent (acceptable en MVP si LibraryScreen est rarement la source d'arrivée)

## Critères de succès

- ✅ Tous les critères d'acceptation TASK-030 cochés
- ✅ Tests verts (mobile + API + domain + shared)
- ✅ Lint mobile zéro warning (`--max-warnings 0`)
- ✅ Typecheck clean
- ✅ Pipeline E2E vérifié manuellement : ComposeScreen → Generating (anneaux + phases défilent) → Player
