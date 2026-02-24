# TASK-008 — Project CRUD Backend (apps/api)

**Statut** : `done`
**Epic** : E2 — Gestion de projet & Ingestion de sources
**User Story** : US-2.1.1
**Dépendances** : TASK-003 (API scaffold)

## Contexte
Implémenter le CRUD projets côté backend : création, liste, détail. ProjectEntity existe déjà dans packages/domain. Il faut les use cases, le repository et les routes API.

## User Story
En tant qu'utilisateur, je veux créer un nouveau projet avec un nom, afin d'organiser mes podcasts.

## Critères d'acceptation
- [ ] Port ProjectRepository (interface)
- [ ] Adapter SupabaseProjectRepository
- [ ] Use case CreateProject (validate name 1-100 chars, status draft, user_id from JWT)
- [ ] Use case GetUserProjects (liste des projets d'un utilisateur)
- [ ] Use case GetProject (détail d'un projet)
- [ ] POST /api/projects → 201 avec le projet créé
- [ ] GET /api/projects → 200 avec la liste des projets de l'utilisateur
- [ ] GET /api/projects/:id → 200 avec le détail du projet
- [ ] Toutes les routes protégées par auth middleware
- [ ] Tests unitaires complets (TDD)

## Sous-tâches
- [ ] Définir ProjectRepository port
- [ ] RED: Test CreateProject use case
- [ ] GREEN: Implémenter CreateProject
- [ ] RED: Test GetUserProjects use case
- [ ] GREEN: Implémenter GetUserProjects
- [ ] RED: Test GetProject use case
- [ ] GREEN: Implémenter GetProject
- [ ] RED: Test routes POST/GET /api/projects
- [ ] GREEN: Implémenter les routes
- [ ] Implémenter SupabaseProjectRepository adapter
- [ ] REFACTOR: Injection de dépendances dans create-app

## Notes techniques
- ProjectEntity.create() existe déjà — réutiliser
- ProjectName VO existe pour la validation du nom
- Le user_id vient du JWT (middleware auth existant)
- Le repository traduit les snake_case DB en camelCase domain
