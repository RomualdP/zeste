# TASK-026 — API External Adapters

**Statut** : `done`
**Epic** : E10 — Infrastructure
**Dépendances** : TASK-010, TASK-012, TASK-014

## Contexte
Implémenter les adapters concrets pour les 4 ports restants : LLM (Mistral), Ingestion (Jina Reader), TTS (Fish Audio), Audio Storage (Supabase Storage).

## Critères d'acceptation
- [ ] MistralLlmService implémente LlmServicePort
- [ ] JinaIngestionService implémente IngestionServicePort
- [ ] FishAudioTtsService implémente TtsServicePort
- [ ] SupabaseAudioStorage implémente AudioStoragePort
- [ ] Tests unitaires avec mocks des appels HTTP
- [ ] server.ts mis à jour avec injection des adapters
- [ ] .env.example à jour
