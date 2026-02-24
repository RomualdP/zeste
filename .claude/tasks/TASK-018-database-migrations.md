# TASK-018 — Database Migrations SQL

**Statut** : `done`
**Epic** : E10 — Infrastructure
**Dépendances** : TASK-001, TASK-002

## Contexte
Créer les fichiers de migration SQL pour toutes les tables du schéma. Les migrations seront appliquées via Supabase CLI ou directement dans le dashboard.

## Critères d'acceptation
- [ ] Migration initiale avec toutes les tables : users, projects, sources, chapters, shared_links
- [ ] Enums PostgreSQL pour les types (tone, duration, status, etc.)
- [ ] Foreign keys et index appropriés
- [ ] RLS policies pour la sécurité
- [ ] Fichier de seed optionnel pour le développement
