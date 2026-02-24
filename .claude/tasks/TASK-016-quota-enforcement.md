# TASK-016 — Quota Enforcement (apps/api — cross-BC)

**Statut** : `done`
**Epic** : E8 — Freemium & Quotas
**User Story** : US-8.1.1
**Dépendances** : TASK-008, TASK-009

## Contexte
Vérifier les quotas (nombre de projets, sources par projet, durée audio) selon le tier de l'utilisateur (free/premium). Service partagé utilisé par les use cases existants.

## User Story
En tant qu'utilisateur gratuit, je vois les limites de mon forfait (3 projets, 3 sources/projet, 50 pages PDF, 15 min audio max).

## Critères d'acceptation
- [ ] QuotaService dans shared/services avec vérification des limites
- [ ] checkProjectQuota : vérifie max projets
- [ ] checkSourceQuota : vérifie max sources par projet
- [ ] checkDurationQuota : vérifie durée audio max
- [ ] Intégration dans CreateProject use case
- [ ] Intégration dans AddSource use case
- [ ] Intégration dans ConfigureProject use case (durée)
- [ ] Tests unitaires complets

## Notes techniques
- QUOTAS constant existe dans packages/shared
- UserEntity a un tier (free/premium) avec upgradeTier/downgradeTier
- Le QuotaService reçoit le user tier et vérifie les limites
