# TASK-014 — Audio Generation Backend (apps/api — BC Audio)

**Statut** : `done`
**Epic** : E5 — Génération audio (TTS)
**User Story** : US-5.1.1, US-5.2.1
**Dépendances** : TASK-012, TASK-013

## Contexte
Convertir les scripts textuels en fichiers MP3. Nouveau Bounded Context "Audio" dans l'API. Utilise Fish Audio API pour la synthèse vocale.

## User Story
En tant qu'utilisateur, je veux que le système génère des fichiers audio MP3 à partir du scénario, avec deux voix distinctes (hôte et expert).

## Critères d'acceptation
- [ ] Nouveau BC modules/audio/ avec ports/use-cases/infrastructure/interfaces
- [ ] Port TtsServicePort (interface) pour abstraction du service TTS
- [ ] Port AudioStoragePort (interface) pour stockage des fichiers audio
- [ ] Use case GenerateChapterAudio (script → MP3 par chapitre)
- [ ] Use case GenerateProjectAudio (orchestre la génération complète : plan → script → audio)
- [ ] POST /api/projects/:id/generate-audio → 202 lance la génération audio
- [ ] GET /api/projects/:id/audio-status → état de la génération
- [ ] Tests unitaires avec mock TTS

## Notes techniques
- Fish Audio API pour TTS (2 voix distinctes : host, expert)
- Une voix par speaker, concaténation des segments par chapitre
- Audio MP3 128kbps
- Stockage dans Supabase Storage via AudioStoragePort
- ChapterEntity.markReady(audioPath, audioDuration) existe déjà
- ProjectEntity.markReady() pour marquer le projet complet
- Durée estimée via AUDIO.WORDS_PER_MINUTE (150 mots/min)
