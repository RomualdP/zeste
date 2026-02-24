# TASK-011 — Configure Podcast Backend (apps/api — BC Project)

**Statut** : `done`
**Epic** : E3 — Configuration du podcast
**User Story** : US-3.1.1, US-3.2.1, US-3.3.1
**Dépendances** : TASK-008

## Contexte
Permettre la configuration du podcast (ton, durée, nombre de chapitres). ProjectEntity.configure() existe déjà avec validation. Il faut le use case, la route PATCH, et la validation des contraintes chapters/duration du PRD.

## User Story
En tant qu'utilisateur, je veux configurer le ton, la durée et le nombre de chapitres de mon podcast, afin de personnaliser le contenu généré.

## Critères d'acceptation
- [ ] Use case ConfigureProject (appelle ProjectEntity.configure())
- [ ] Validation : projet doit avoir ≥1 source ingérée pour être configuré
- [ ] Validation : chapter count contraint par duration (max 2 pour 5min, max 6 pour 30min)
- [ ] PATCH /api/projects/:id/configure → 200 avec projet mis à jour
- [ ] Route protégée par auth + ownership check
- [ ] Tests unitaires complets (TDD)

## Notes techniques
- ProjectEntity.configure() valide déjà tone, targetDuration, chapterCount
- Ajouter la contrainte chapters/duration dans le use case (pas dans l'entité)
- Mapping PRD : 5min → max 2, 15min → max 4, 30min → max 6
- Le projet doit être en status "draft" pour être configuré (déjà validé par l'entité)
