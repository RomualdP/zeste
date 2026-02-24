# TASK-020 — CI/CD Pipeline (GitHub Actions)

**Statut** : `done`
**Epic** : E10 — Infrastructure & DevOps
**User Story** : US-10.2.1

## Contexte
Mettre en place la pipeline CI/CD avec GitHub Actions pour lint, typecheck, tests sur chaque PR.

## Critères d'acceptation
- [ ] Workflow GitHub Actions pour lint + typecheck + tests
- [ ] Cache pnpm pour accélérer les builds
- [ ] Exécution sur pull requests et push sur main
- [ ] Fail fast si un step échoue
