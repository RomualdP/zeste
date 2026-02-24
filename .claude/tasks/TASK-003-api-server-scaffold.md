# TASK-003 — API Server Scaffold (apps/api)

**Statut** : `done`
**Epic** : E10 — Infrastructure & DevOps (fondation)
**User Story** : US-10.1.1
**Dépendances** : Aucune

## Contexte
L'API backend n'a aucune structure. Il faut mettre en place le serveur Fastify avec l'architecture hexagonale DDD (interfaces/application/domain/infrastructure), le health check, la gestion d'erreurs et le middleware d'authentification (stub pour l'instant).

## User Story
En tant que développeur, je veux un serveur API structuré en architecture hexagonale, afin d'implémenter les use cases de manière découplée.

## Critères d'acceptation
- [ ] Serveur Fastify opérationnel avec configuration TypeScript
- [ ] Structure de dossiers hexagonale : interfaces/, application/, infrastructure/
- [ ] Route GET /health qui retourne { status: 'ok' }
- [ ] Middleware de gestion d'erreurs centralisé
- [ ] Middleware d'authentification (stub — sera connecté à Supabase dans TASK-005)
- [ ] Configuration par variables d'environnement (PORT, NODE_ENV)
- [ ] Tests unitaires du health check et du error handler
- [ ] Le serveur démarre sans erreur

## Sous-tâches
- [ ] Installer Fastify + dépendances (@fastify/cors, @fastify/sensible)
- [ ] Créer la structure de dossiers dans apps/api/src/
- [ ] Implémenter le serveur Fastify (create-app.ts + server.ts)
- [ ] Implémenter le health check route
- [ ] Implémenter le error handler plugin
- [ ] Implémenter le auth middleware (stub)
- [ ] Tests unitaires (Vitest)
- [ ] Vérifier que `pnpm dev --filter api` démarre le serveur

## Notes techniques
- Fastify (pas Express) — plus performant, meilleur support TypeScript
- Structure cible :
  ```
  apps/api/src/
  ├── interfaces/        # Routes HTTP, controllers, middlewares
  │   ├── http/
  │   │   ├── routes/
  │   │   ├── middlewares/
  │   │   └── plugins/
  │   └── index.ts
  ├── application/       # Use cases
  ├── infrastructure/    # Supabase, Mistral, Fish Audio adapters
  ├── create-app.ts      # Factory du serveur Fastify
  └── server.ts          # Point d'entrée (écoute le port)
  ```
- Séparer create-app.ts (testable) de server.ts (side-effect)
