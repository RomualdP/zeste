# Zeste — AI Podcast Generator

## Contexte projet

Zeste est un **AI Podcast Generator** (MVP). L'utilisateur transforme des documents (URLs, PDFs) en podcasts audio personnalisés, structurés en chapitres, avec deux voix (hôte + expert).

- **PRD complet** : `docs/prd-ai-podcast-mvp.md`
- **Version** : MVP v1.0 — Février 2026
- **Langue** : Français uniquement (MVP)

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Monorepo | Turborepo + pnpm workspaces |
| Mobile | React Native + Expo |
| Backend | Node.js + TypeScript (Fastify ou Express) |
| BDD | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Job Queue | BullMQ + Redis |
| LLM | Mistral API |
| Ingestion | Mistral Pixtral + Jina Reader |
| TTS | Fish Audio API |
| Push | Expo Notifications |
| CI/CD | GitHub Actions |

## Structure monorepo

```
apps/mobile/       → React Native Expo (front BDD)
apps/api/          → Backend Node.js TS (back DDD)
apps/web/          → Mini-lecteur de partage
packages/shared/   → Types, DTOs, enums, constantes
packages/domain/   → Entités DDD, Value Objects, Domain Events
docs/              → PRD, ADR, documentation
```

## Rôles d'agents

### Architecte
- Analyse le PRD et découpe en tâches
- Valide les choix techniques et les patterns
- Vérifie la cohérence avec l'architecture (BDD front, DDD back)
- **Ne code jamais** — produit uniquement des specs et des décisions

### Exécuteur
- Implémente en **TDD strict** (RED → GREEN → REFACTOR)
- Un seul test à la fois, jamais de code sans test
- Suit les tâches de `.claude/tasks/`
- Commit atomique par sous-tâche complétée

### Debugger
- Diagnostique les erreurs (logs, stack traces, tests qui échouent)
- Propose des fixes ciblés et minimaux
- Ne refactore pas — corrige uniquement le problème

### Reviewer
- Revue de code post-implémentation
- Vérifie : tests suffisants, cohérence patterns, qualité du code
- Signale les violations des conventions
- Valide ou rejette avec commentaires

## Méthode TDD

Cycle obligatoire pour toute implémentation :

1. **RED** — Écrire un test qui échoue (le test décrit le comportement attendu)
2. **GREEN** — Écrire le code minimum pour faire passer le test
3. **REFACTOR** — Améliorer le code sans casser les tests

Règles :
- Pas de code de production sans test correspondant
- Un seul test à la fois
- Le test doit échouer avant d'écrire le code
- Le refactoring ne change pas le comportement (les tests restent verts)

## Tâches persistantes

Les tâches sont dans `.claude/tasks/` au format `TASK-XXX-description.md`.

Chaque tâche contient :
- **Statut** : `todo` | `in_progress` | `done` | `blocked`
- **Contexte** : Pourquoi cette tâche existe
- **User Story** : En tant que..., je veux..., afin de...
- **Critères d'acceptation** : Liste de conditions vérifiables
- **Sous-tâches** : Checklist détaillée
- **Epic** : Référence à l'Epic du PRD (E1–E10)

Les tâches mappent directement les User Stories du PRD.

## Dantotsu (Auto-diagnostic)

Après chaque phase ou epic complétée, créer un diagnostic dans `.claude/dantotsu/`.

Format : `DIAG-YYYY-MM-DD-description.md`

Sections obligatoires :
1. **Succès** — Ce qui a bien fonctionné
2. **Problèmes** — Difficultés rencontrées
3. **Actions correctives** — Ce qu'on change pour la suite
4. **Mise à jour mémoire** — Patterns validés à ajouter dans `memory/MEMORY.md`

## Conventions de code

### Nommage
- **Fichiers** : kebab-case (`create-project.ts`, `auth.feature`)
- **Classes/Types** : PascalCase (`Project`, `CreateProjectUseCase`)
- **Fonctions/Variables** : camelCase (`createProject`, `projectName`)
- **Constantes** : SCREAMING_SNAKE_CASE (`MAX_SOURCES_FREE_TIER`)
- **Enums** : PascalCase pour le type, PascalCase pour les valeurs

### Structure des fichiers
- Un export principal par fichier
- Index files pour les exports publics du module
- Co-localiser les tests avec le code (`*.test.ts` ou `*.spec.ts`)
- Co-localiser les scénarios Gherkin avec les features (`.feature`)

### Patterns

**Backend (DDD)** :
- Bounded Contexts : Identity, Project, Scenario, Audio, Sharing, Billing
- Architecture hexagonale : Domain → Application → Infrastructure
- Ports & Adapters pour découpler le domaine des fournisseurs
- Domain Events pour la communication inter-contextes

**Frontend (BDD)** :
- Organisé par feature (auth, project, player, sharing)
- Chaque feature a : screens/, components/, hooks/, *.feature
- Scénarios Gherkin = spécification + tests + documentation

### Imports
- Préférer les imports absolus via les alias (`@zeste/shared`, `@zeste/domain`)
- Pas d'imports circulaires entre workspaces

### Tests
- `packages/shared` et `packages/domain` : **Vitest**
- `apps/mobile` : **Jest** + React Native Testing Library
- Scénarios BDD : **Jest-Cucumber** (`.feature` files)
- Nommage des tests : `describe('NomDuModule')` → `it('should ...')`
