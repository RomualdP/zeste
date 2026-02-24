# TASK-013 — Chapter Management Backend (apps/api — BC Scenario)

**Statut** : `done`
**Epic** : E4 — Génération du scénario & Prévisualisation
**User Story** : US-4.2.1, US-4.2.2
**Dépendances** : TASK-012

## Contexte
Permettre la réorganisation et suppression des chapitres après génération du plan. Routes CRUD chapitres.

## User Story
En tant qu'utilisateur, je veux réordonner et supprimer des chapitres du plan, afin d'organiser le podcast à ma convenance.

## Critères d'acceptation
- [ ] Use case ReorderChapters (batch update positions)
- [ ] Use case DeleteChapter (avec vérification ≥1 chapitre restant)
- [ ] GET /api/projects/:id/chapters → liste des chapitres ordonnés
- [ ] PATCH /api/projects/:id/chapters/reorder → mise à jour des positions
- [ ] DELETE /api/projects/:id/chapters/:chapterId → suppression
- [ ] Tests unitaires complets

## Notes techniques
- UpdateChapterOrderDto existe déjà dans packages/shared
- ChapterEntity existe dans packages/domain avec position
- La suppression vérifie qu'il reste ≥1 chapitre
