# TASK-005 — Auth Use Cases + Supabase Integration (apps/api)

**Statut** : `done`
**Epic** : E1 — Authentification & Gestion de compte
**User Story** : US-1.1.1, US-1.1.2, US-1.2.1, US-1.2.2, US-1.3.1
**Dépendances** : TASK-003, TASK-004

## Contexte
Implémenter la couche Application (use cases) et Infrastructure (Supabase) pour l'authentification. Architecture hexagonale avec ports (interfaces) et adapters (Supabase).

## User Story
En tant qu'utilisateur, je veux créer un compte, me connecter et supprimer mon compte, afin d'utiliser l'application de manière sécurisée.

## Critères d'acceptation
- [ ] Port AuthService (interface) défini dans le domaine
- [ ] Adapter SupabaseAuthService implémente le port
- [ ] Use case RegisterUser (email/password + validation)
- [ ] Use case LoginUser (email/password → JWT tokens)
- [ ] Use case LogoutUser (invalidation session)
- [ ] Use case DeleteAccount (suppression RGPD)
- [ ] Port UserRepository (interface) défini
- [ ] Adapter SupabaseUserRepository implémente le port
- [ ] Configuration Supabase client (env vars : SUPABASE_URL, SUPABASE_SERVICE_KEY)
- [ ] Tests unitaires avec mocks des ports (pas de dépendance Supabase dans les tests)

## Sous-tâches
- [ ] Définir le port AuthService (interfaces/ports/auth-service.port.ts)
- [ ] Définir le port UserRepository (interfaces/ports/user-repository.port.ts)
- [ ] RED: Test RegisterUser use case
- [ ] GREEN: Implémenter RegisterUser use case
- [ ] RED: Test LoginUser use case
- [ ] GREEN: Implémenter LoginUser use case
- [ ] RED: Test LogoutUser use case
- [ ] GREEN: Implémenter LogoutUser use case
- [ ] RED: Test DeleteAccount use case
- [ ] GREEN: Implémenter DeleteAccount use case
- [ ] Implémenter SupabaseAuthService adapter
- [ ] Implémenter SupabaseUserRepository adapter
- [ ] Configurer le client Supabase (infrastructure/supabase/)
- [ ] REFACTOR: Injection de dépendances propre

## Notes techniques
- Architecture hexagonale stricte : les use cases dépendent des ports (interfaces), jamais de Supabase directement
- Les tests unitaires mockent les ports → pas besoin de Supabase pour tester
- Supabase Auth gère : hash des mots de passe, tokens JWT, sessions, OAuth providers
- L'adapter traduit les réponses Supabase en entités du domaine
- Variables d'environnement : SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- OAuth (Google/Apple) : configurer les providers dans Supabase Dashboard, pas dans le code API
- La suppression de compte utilise la service_role key pour supprimer les données admin
