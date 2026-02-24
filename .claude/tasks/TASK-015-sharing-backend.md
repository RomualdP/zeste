# TASK-015 — Sharing Backend (apps/api — BC Sharing)

**Statut** : `done`
**Epic** : E7 — Export & Partage
**User Story** : US-7.2.1
**Dépendances** : TASK-014

## Contexte
Permettre la création de liens de partage publics pour les podcasts. Nouveau Bounded Context "Sharing".

## User Story
En tant qu'utilisateur, je veux générer un lien de partage unique pour mon podcast, afin de le partager avec d'autres personnes via un lecteur web.

## Critères d'acceptation
- [ ] SharedLinkEntity dans packages/domain avec slug unique
- [ ] Nouveau BC modules/sharing/ avec ports/use-cases/interfaces
- [ ] Port SharedLinkRepositoryPort
- [ ] Use case CreateSharedLink (génère un slug unique)
- [ ] Use case GetSharedLink (par slug, pour le lecteur web public)
- [ ] Use case DeactivateSharedLink
- [ ] POST /api/projects/:id/share → 201 avec lien de partage
- [ ] GET /api/shared/:slug → 200 avec données projet + chapitres (public, pas d'auth)
- [ ] DELETE /api/projects/:id/share → 204 désactive le lien
- [ ] Tests unitaires complets

## Notes techniques
- SharedLink type existe dans packages/shared
- Le slug doit être unique et URL-safe (8-12 chars)
- La route GET /api/shared/:slug est publique (pas d'auth)
- Le projet doit être en status "ready" pour être partagé
