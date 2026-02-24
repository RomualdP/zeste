# TASK-001 — Shared Enums & Types (packages/shared)

**Statut** : `done`
**Epic** : E10 — Infrastructure & DevOps (fondation)
**User Story** : US-10.1.1

## Contexte
Le package shared est la fondation du monorepo. Il exporte les types, enums et constantes partagés entre tous les workspaces. Les enums et types dérivent directement du modèle de données du PRD (section 6).

## User Story
En tant que développeur, je veux avoir des types TypeScript partagés entre front et back, afin de garantir la cohérence des données.

## Critères d'acceptation
- [x] Enums définis : UserTier, ProjectStatus, SourceType, SourceStatus, Tone, TargetDuration, ChapterStatus
- [x] Types/interfaces pour chaque entité du modèle de données : User, Project, Source, Chapter, SharedLink
- [x] DTOs pour les opérations principales : CreateProject, AddSource, UpdateChapterOrder
- [x] Constantes des quotas (FREE_TIER, PREMIUM_TIER)
- [x] Tous les tests passent (TDD)
- [x] Typecheck passe

## Sous-tâches
- [x] Créer les enums dans packages/shared/src/enums/
- [x] Créer les types dans packages/shared/src/types/
- [x] Créer les DTOs dans packages/shared/src/dtos/
- [x] Créer les constantes dans packages/shared/src/constants/
- [x] Tests unitaires pour les constantes et les helpers
- [x] Mettre à jour l'index.ts

## Notes techniques
- Source : PRD section 6 (Modèle de données)
- Les types sont des interfaces (pas des classes) — les classes sont dans packages/domain
- Les enums sont des union types ou const enums pour le tree-shaking
