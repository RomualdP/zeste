# TASK-017 — Supabase Repository Adapters (Scenario + Sharing BCs)

**Statut** : `done`
**Epic** : E10 — Infrastructure
**Dépendances** : TASK-012, TASK-013, TASK-015

## Contexte
Implémenter les adapters Supabase pour les repositories qui n'ont pas encore d'implémentation concrète : ChapterRepository et SharedLinkRepository. Suivre le pattern existant des adapters Identity et Project.

## Critères d'acceptation
- [ ] SupabaseChapterRepository dans modules/scenario/infrastructure/
- [ ] SupabaseSharedLinkRepository dans modules/sharing/infrastructure/
- [ ] Tests unitaires pour chaque adapter
- [ ] Mapping correct entre les rows DB et les entités du domaine
