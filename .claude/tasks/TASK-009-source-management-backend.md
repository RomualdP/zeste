# TASK-009 — Source Management Backend (apps/api)

**Statut** : `in_progress`
**Epic** : E2 — Gestion de projet & Ingestion de sources
**User Story** : US-2.2.1, US-2.3.1, US-2.4.1, US-2.4.2
**Dépendances** : TASK-008

## Contexte
Implémenter la gestion des sources : ajout d'URL/PDF, listing, suppression. SourceEntity existe dans packages/domain. L'ingestion réelle (Jina/Pixtral) sera dans TASK-010 — ici on définit le port et on mock.

## User Story
En tant qu'utilisateur, je veux ajouter des sources (URLs, PDFs) à mon projet et les gérer, afin d'alimenter le podcast.

## Critères d'acceptation
- [ ] Port SourceRepository (interface)
- [ ] Port IngestionService (interface) — stubbed pour TASK-010
- [ ] Adapter SupabaseSourceRepository
- [ ] Use case AddSource (URL ou PDF, validation, lancement ingestion async)
- [ ] Use case GetProjectSources (liste des sources d'un projet)
- [ ] Use case DeleteSource (suppression avec vérification ownership)
- [ ] POST /api/projects/:id/sources → 201 source ajoutée
- [ ] GET /api/projects/:id/sources → 200 liste des sources
- [ ] DELETE /api/projects/:id/sources/:sourceId → 204 source supprimée
- [ ] Vérification que le projet appartient à l'utilisateur
- [ ] Tests unitaires complets (TDD)

## Sous-tâches
- [ ] Définir SourceRepository port
- [ ] Définir IngestionService port (interface)
- [ ] RED: Test AddSource use case
- [ ] GREEN: Implémenter AddSource
- [ ] RED: Test GetProjectSources use case
- [ ] GREEN: Implémenter GetProjectSources
- [ ] RED: Test DeleteSource use case
- [ ] GREEN: Implémenter DeleteSource
- [ ] RED: Test routes source
- [ ] GREEN: Implémenter les routes
- [ ] Implémenter SupabaseSourceRepository adapter
- [ ] REFACTOR

## Notes techniques
- L'ingestion est asynchrone : AddSource crée la source en pending, lance l'ingestion en background
- Pour le MVP on peut faire l'ingestion synchrone dans le use case (pas de BullMQ encore)
- Vérifier l'ownership projet : le user_id du projet doit matcher le JWT
- SourceEntity existe déjà avec statut pending → ingested → error
