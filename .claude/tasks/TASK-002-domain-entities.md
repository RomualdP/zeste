# TASK-002 — Domain Entities (packages/domain)

**Statut** : `done`
**Epic** : E10 — Infrastructure & DevOps (fondation)
**User Story** : US-10.1.1

## Contexte
Le package domain contient les entités DDD, Value Objects et Domain Events. Les entités encapsulent la logique métier et les règles de validation.

## User Story
En tant que développeur, je veux avoir des entités DDD partagées avec leur logique métier, afin de garantir l'intégrité des données dans toute l'application.

## Critères d'acceptation
- [ ] Entités DDD : User, Project, Source, Chapter, SharedLink
- [ ] Value Objects : Email, ProjectName, Slug, AudioDuration
- [ ] Domain Events : ProjectCreated, SourceIngested, ScenarioGenerated, ChapterAudioGenerated, PodcastReady
- [ ] Règles métier encodées dans les entités (validation, transitions de statut)
- [ ] Tests unitaires complets (TDD)

## Sous-tâches
- [ ] Créer la classe de base Entity et ValueObject
- [ ] Implémenter les Value Objects avec validation
- [ ] Implémenter les entités avec logique métier
- [ ] Créer les Domain Events
- [ ] Tests unitaires pour chaque entité et VO
- [ ] Mettre à jour l'index.ts

## Notes techniques
- Bounded Contexts du PRD : Identity, Project, Scenario, Audio, Sharing, Billing
- Les entités utilisent les types de @zeste/shared
- Patterns : Entity base class avec id, equals(), Value Object immutable
