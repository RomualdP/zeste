# TASK-012 — Scenario Generation Backend (apps/api — BC Scenario)

**Statut** : `done`
**Epic** : E4 — Génération du scénario & Prévisualisation
**User Story** : US-4.1.1, US-4.3.1
**Dépendances** : TASK-011

## Contexte
Générer un plan de chapitres puis un scénario complet via Mistral LLM. Nouveau Bounded Context "Scenario" dans l'API. C'est le coeur du pipeline IA.

## User Story
En tant qu'utilisateur, je veux générer un plan de chapitres à partir de mes sources, puis lancer la génération du scénario complet.

## Critères d'acceptation
- [ ] Nouveau BC modules/scenario/ avec ports/use-cases/infrastructure/interfaces
- [ ] Port LlmService (interface) pour abstraction du LLM
- [ ] Port ChapterRepository (interface)
- [ ] Use case GenerateChapterPlan (sources → plan de chapitres via LLM)
- [ ] Use case GenerateScenario (plan → script complet par chapitre via LLM)
- [ ] POST /api/projects/:id/generate-plan → 200 avec plan de chapitres
- [ ] POST /api/projects/:id/generate → 202 lance la génération (status → processing)
- [ ] Adapter MistralLlmService (implémente LlmService port)
- [ ] Prompt templates par ton (pédagogue, débat, vulgarisation, interview)
- [ ] Format script JSON : [{speaker: 'host'|'expert', text: '...'}]
- [ ] Tests unitaires avec mock LLM

## Notes techniques
- Mistral API en mode JSON structuré pour le plan
- Génération chapitre par chapitre avec contexte des chapitres précédents
- Mapping durée → mots cible : 5min≈750, 15min≈2250, 30min≈4500
- ChapterEntity existe déjà dans packages/domain
- Domain events : ScenarioGenerated (déjà défini)
