# TASK-006 — Auth API Routes (apps/api)

**Statut** : `done`
**Epic** : E1 — Authentification & Gestion de compte
**User Story** : US-1.1.1, US-1.1.2, US-1.2.1, US-1.2.2, US-1.3.1
**Dépendances** : TASK-005

## Contexte
Exposer les use cases d'authentification via des routes HTTP REST. Connecter le middleware d'authentification réel (Supabase JWT verification).

## User Story
En tant que client mobile, je veux des endpoints REST pour l'authentification, afin d'implémenter les écrans de connexion et inscription.

## Critères d'acceptation
- [ ] POST /api/auth/register — inscription email/password
- [ ] POST /api/auth/login — connexion email/password
- [ ] POST /api/auth/logout — déconnexion (requiert auth)
- [ ] DELETE /api/auth/account — suppression de compte (requiert auth + confirmation)
- [ ] Middleware auth Fastify vérifiant le JWT Supabase
- [ ] Validation des inputs (schemas Fastify/Zod)
- [ ] Réponses d'erreur standardisées (codes HTTP appropriés)
- [ ] Tests d'intégration des routes (avec mocks des use cases)

## Sous-tâches
- [ ] Implémenter le middleware auth Fastify (JWT Supabase verification)
- [ ] RED: Test POST /api/auth/register
- [ ] GREEN: Implémenter la route register
- [ ] RED: Test POST /api/auth/login
- [ ] GREEN: Implémenter la route login
- [ ] RED: Test POST /api/auth/logout
- [ ] GREEN: Implémenter la route logout
- [ ] RED: Test DELETE /api/auth/account
- [ ] GREEN: Implémenter la route delete account
- [ ] Ajouter les schemas de validation (Zod ou JSON Schema Fastify)
- [ ] REFACTOR: Standardiser les réponses d'erreur

## Notes techniques
- Format des réponses : `{ data: T }` en succès, `{ error: { code: string, message: string } }` en erreur
- Codes HTTP : 201 (register), 200 (login/logout), 204 (delete), 400 (validation), 401 (unauthorized), 409 (email déjà pris)
- Le middleware auth décode le JWT et attache l'utilisateur au request
- Utiliser Fastify schema validation (built-in) ou Zod avec @fastify/type-provider-zod
- Les routes auth (register, login) ne requièrent PAS le middleware auth
- Les routes protégées (logout, delete) requièrent le middleware auth
