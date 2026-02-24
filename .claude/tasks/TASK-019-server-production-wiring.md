# TASK-019 — Server Production Wiring

**Statut** : `done`
**Epic** : E10 — Infrastructure
**Dépendances** : TASK-017

## Contexte
Mettre à jour server.ts pour injecter tous les adapters Supabase réels au démarrage. Actuellement le serveur ne wire que les adapters Identity et Project.

## Critères d'acceptation
- [ ] server.ts injecte tous les adapters dans createApp()
- [ ] Imports de tous les adapters Supabase
- [ ] Variables d'environnement documentées (.env.example)
- [ ] Graceful shutdown
