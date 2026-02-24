# TASK-010 — Source Ingestion Infrastructure (apps/api)

**Statut** : `todo`
**Epic** : E2 — Gestion de projet & Ingestion de sources
**User Story** : US-2.2.1, US-2.3.1
**Dépendances** : TASK-009

## Contexte
Implémenter les adapters concrets pour l'ingestion de sources : Jina Reader pour les URLs, Mistral Pixtral pour les PDFs. Ces adapters implémentent le port IngestionService défini dans TASK-009.

## User Story
En tant que système, je veux extraire le contenu des URLs et PDFs ajoutés par l'utilisateur, afin d'alimenter la génération de scénario.

## Critères d'acceptation
- [ ] JinaReaderAdapter : extraction d'URL vers markdown via r.jina.ai
- [ ] Fallback fetch + cheerio si Jina échoue
- [ ] MistralPixtralAdapter : extraction de PDF via Mistral vision OCR
- [ ] Gestion des erreurs (URL inaccessible, PDF corrompu, contenu vide)
- [ ] Mise à jour du statut source : pending → ingested ou error
- [ ] Tests unitaires avec mocks HTTP

## Notes techniques
- Jina Reader : GET https://r.jina.ai/{url} → markdown
- Mistral Pixtral : API vision pour OCR des PDFs scannés
- Les adapters ne sont pas testés en intégration (besoin des clés API)
- Les tests unitaires mockent les appels HTTP
- Stockage PDF : Supabase Storage (upload avant ingestion)
