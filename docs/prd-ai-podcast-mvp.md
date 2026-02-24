# PRODUCT REQUIREMENTS DOCUMENT

## AI Podcast Generator

**MVP — Application Mobile**
**Version 1.0 — Février 2026**
*Document préparé pour le découpage en Ralph Loop*

---

## Table des matières

1. [Vision & Contexte](#1-vision--contexte)
2. [Utilisateur cible & Persona](#2-utilisateur-cible--persona)
3. [Parcours utilisateur (User Journey)](#3-parcours-utilisateur-user-journey)
4. [Architecture technique](#4-architecture-technique)
5. [Stack technique détaillée](#5-stack-technique-détaillée)
6. [Modèle de données](#6-modèle-de-données)
7. [Epics & Features](#7-epics--features)
8. [Limites & Hors scope MVP](#8-limites--hors-scope-mvp)
9. [Living Documentation](#9-living-documentation)
10. [Structure Monorepo](#10-structure-monorepo)
11. [Glossaire](#11-glossaire)

---

## 1. Vision & Contexte

Créer une application mobile permettant à tout utilisateur de transformer des documents variés (URLs, PDFs) en podcasts audio personnalisés, générés par IA, structurés en chapitres et jouables directement dans l'application.

**Positionnement** : Un NotebookLM personnalisable en profondeur pour la dimension audio. L'utilisateur contrôle le ton, la durée, la structure en chapitres et obtient un podcast à deux voix (hôte + expert) prêt à écouter.

**Objectif MVP** : Valider le pipeline complet (ingestion → scénario → audio) avec une expérience utilisateur fluide sur iOS et Android, en français, avec un modèle freemium.

**Contraintes clés** :
- Modèles d'IA français (Mistral AI) pour le LLM et l'ingestion
- Coûts d'infrastructure maîtrisés
- Application mobile iOS + Android (React Native / Expo)
- Architecture propre : front BDD, back DDD, living documentation

## 2. Utilisateur cible & Persona

| Attribut | Détail |
|----------|--------|
| Profil | Grand public curieux, type utilisateur NotebookLM |
| Motivation | Consommer de l'information dense sous forme audio, pendant les trajets, le sport, etc. |
| Compétence technique | Faible à moyenne — l'app doit être intuitive sans configuration complexe |
| Langue | Francophone (MVP français uniquement) |
| Devices | Smartphone iOS ou Android |
| Cas d'usage principal | Coller quelques URLs / uploader des PDFs et obtenir un podcast structuré en quelques minutes |

## 3. Parcours utilisateur (User Journey)

### Flux principal (happy path)

1. **Onboarding** — L'utilisateur télécharge l'app et crée un compte (email/mdp ou OAuth Google/Apple).
2. **Création de projet** — Il crée un nouveau projet et lui donne un nom.
3. **Ajout de sources** — Il ajoute des sources : colle des URLs, uploade des PDFs, ou mixe les deux dans le même projet.
4. **Configuration** — Il choisit le ton (pédagogue, débat, vulgarisation, interview) et la durée cible (5, 15 ou 30 minutes). Il sélectionne le nombre de chapitres souhaité.
5. **Ingestion & Plan** — L'app ingère les sources et génère un plan de chapitres. L'utilisateur peut réordonner ou supprimer des chapitres.
6. **Lancement** — Il valide le plan et lance la génération. Il peut quitter l'app.
7. **Notification** — Il reçoit une notification push quand le podcast est prêt.
8. **Écoute** — Il écoute dans le lecteur intégré (playlist par chapitres).
9. **Export / Partage** — Il peut exporter en MP3 ou partager un lien public avec mini-lecteur web.

### Flux d'erreur

- URL inaccessible ou contenu vide → message d'erreur spécifique, la source est marquée en échec mais le projet continue avec les autres sources
- PDF trop volumineux ou illisible → rejet avec message explicatif
- Échec de génération → notification d'échec avec bouton « Réessayer »
- Quota atteint (tier gratuit) → modale d'upgrade vers l'abonnement

## 4. Architecture technique

L'architecture suit un modèle client léger / serveur lourd. L'application mobile est un client qui communique avec une API REST. Tout le traitement IA est côté serveur.

### 4.1 Vue d'ensemble

```
[App Mobile React Native / Expo]
        │
        ▼
[API Backend Node.js / TypeScript]
        │
   ┌────┼────────────────────┐
   ▼         ▼                    ▼
[Supabase]  [Mistral API]  [Fish Audio API]
  • Auth       • LLM (scénario)    • TTS (voix)
  • PostgreSQL • Pixtral (docs)
  • Storage    • Voxtral (STT futur)

[Job Queue: BullMQ + Redis]
  • Workers de génération asynchrone
```

### 4.2 Principes architecturaux

**Frontend — Behavior-Driven Design (BDD)** :
- Chaque écran et interaction est défini par des scénarios Gherkin (Given/When/Then)
- Les scénarios servent à la fois de spécification, de tests E2E et de documentation vivante
- Outils : Cucumber.js ou Jest-Cucumber pour l'exécution des scénarios

**Backend — Domain-Driven Design (DDD)** :
- Bounded contexts identifiés : Identity (auth), Project (sources & config), Scenario (génération de scripts), Audio (TTS & fichiers), Sharing (liens publics), Billing (quotas & abonnements)
- Entités, Value Objects, Aggregates, Domain Events
- Couche Application (use cases) séparée de la couche Infrastructure (Supabase, APIs externes)
- Ports & Adapters (architecture hexagonale) pour découpler le domaine des fournisseurs IA

**Living Documentation** :
- Les scénarios Gherkin du front génèrent une documentation navigable (Pickles, Cucumber Reports)
- Le code DDD du back est annoté pour générer un glossaire ubiquitaire automatisé
- Les ADR (Architecture Decision Records) documentent chaque choix technique dans le repo
- La documentation est toujours synchronisée avec le code car elle en est extraite

## 5. Stack technique détaillée

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Monorepo | Turborepo + pnpm workspaces | Léger, cache intelligent, natif npm |
| Mobile | React Native + Expo | iOS + Android, écosystème large, TS natif |
| Backend | Node.js + TypeScript (Fastify ou Express) | Monorepo full TS, partage de types |
| Base de données | Supabase (PostgreSQL managé) | Auth + Storage + BDD intégrés |
| Auth | Supabase Auth (email/mdp + OAuth) | Intégré, RGPD, social login |
| Stockage fichiers | Supabase Storage (S3-compatible) | Audio MP3, PDFs uploadés |
| Job Queue | BullMQ + Redis | Génération asynchrone fiable |
| LLM | Mistral API (Small / Medium) | Français natif, coûts maîtrisés, RGPD |
| Ingestion docs | Mistral Pixtral (vision) + Jina Reader | OCR PDFs, scraping web propre |
| TTS | Fish Audio API (ou équivalent) | Bon français, prix compétitif |
| Push | Expo Notifications (FCM/APNs) | Intégré à Expo, cross-platform |
| CI/CD | GitHub Actions | Natif monorepo, cache Turborepo |

### Estimation des coûts par épisode (~15 min)

| Composant | Détail | Coût estimé |
|-----------|--------|-------------|
| LLM (scénario) | Mistral Small, ~10k tokens sortie | ~0,02 € |
| TTS (~15 min audio) | Fish Audio API | ~0,10–0,20 € |
| Stockage audio | Supabase Storage | Négligeable |
| **Total par épisode** | | **~0,15–0,25 €** |

## 6. Modèle de données

Modèle PostgreSQL (Supabase). Les relations sont exprimées via clés étrangères.

### users

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | ID Supabase Auth |
| email | text | Email de l'utilisateur |
| display_name | text | Nom affiché |
| tier | enum (free, premium) | Niveau d'abonnement |
| created_at | timestamp | Date de création |

### projects

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| user_id | uuid (FK users) | Propriétaire |
| name | text | Nom du projet |
| tone | enum | pédagogue \| débat \| vulgarisation \| interview |
| target_duration | enum | 5 \| 15 \| 30 (minutes) |
| chapter_count | integer | Nombre de chapitres souhaités |
| status | enum | draft \| processing \| ready \| error |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Dernière modification |

### sources

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| project_id | uuid (FK projects) | Projet parent |
| type | enum (url, pdf) | Type de source |
| url | text (nullable) | URL de la source |
| file_path | text (nullable) | Chemin Supabase Storage du PDF |
| raw_content | text | Contenu extrait (markdown) |
| status | enum | pending \| ingested \| error |
| error_message | text (nullable) | Détail de l'erreur éventuelle |
| created_at | timestamp | Date d'ajout |

### chapters

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| project_id | uuid (FK projects) | Projet parent |
| title | text | Titre du chapitre |
| summary | text | Résumé du contenu du chapitre |
| position | integer | Ordre dans la playlist (réordonnable) |
| script | jsonb | Scénario complet (tableau d'échanges speaker/text/tone) |
| audio_path | text (nullable) | Chemin du fichier MP3 dans Storage |
| audio_duration | integer (nullable) | Durée en secondes |
| status | enum | draft \| generating \| ready \| error |
| created_at | timestamp | Date de création |

### shared_links

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid (PK) | Identifiant unique |
| project_id | uuid (FK projects) | Projet partagé |
| slug | text (unique) | Slug URL-friendly pour le lien public |
| is_active | boolean | Lien actif ou désactivé |
| created_at | timestamp | Date de création |

## 7. Epics & Features

Chaque Epic correspond à un domaine fonctionnel. Chaque Feature contient des User Stories et des critères d'acceptation. Ce découpage est conçu pour alimenter directement un Ralph Loop.

### E1 — Authentification & Gestion de compte

Permettre à l'utilisateur de créer un compte et de se connecter de manière sécurisée.

#### F1.1 — Inscription

**User Stories** :
- **US-1.1.1** En tant que visiteur, je veux créer un compte avec email et mot de passe, afin d'accéder à l'application.
- **US-1.1.2** En tant que visiteur, je veux m'inscrire via Google ou Apple, afin de gagner du temps à l'onboarding.

**Critères d'acceptation** :
- Le formulaire valide le format email et la robustesse du mot de passe (8 caractères min, 1 majuscule, 1 chiffre)
- Un email de vérification est envoyé après inscription par email/mdp
- L'inscription OAuth crée le compte et connecte en un seul clic
- Un utilisateur ne peut pas créer deux comptes avec le même email

**Notes techniques** :
- Utiliser Supabase Auth avec les providers email, Google et Apple
- RLS (Row Level Security) activé dès le départ sur toutes les tables

#### F1.2 — Connexion / Déconnexion

**User Stories** :
- **US-1.2.1** En tant qu'utilisateur, je veux me connecter avec mes identifiants, afin de retrouver mes projets.
- **US-1.2.2** En tant qu'utilisateur, je veux me déconnecter, afin de sécuriser mon compte sur un device partagé.

**Critères d'acceptation** :
- La session persiste entre les fermetures d'app (refresh token)
- Le bouton de déconnexion est accessible depuis les paramètres
- Après déconnexion, l'utilisateur est redirigé vers l'écran de connexion

**Notes techniques** :
- Gestion des tokens via Supabase JS client + SecureStore (Expo)

#### F1.3 — Suppression de compte

**User Stories** :
- **US-1.3.1** En tant qu'utilisateur, je veux supprimer mon compte et toutes mes données, afin d'exercer mon droit RGPD.

**Critères d'acceptation** :
- Une confirmation explicite est demandée (modale avec saisie de « SUPPRIMER »)
- Toutes les données (projets, sources, audios, liens) sont supprimées dans les 48h
- L'utilisateur est déconnecté immédiatement après confirmation

**Notes techniques** :
- Suppression en cascade via RLS + fonction Supabase Edge Function
- Les fichiers Storage sont supprimés de manière asynchrone

### E2 — Gestion de projet & Ingestion de sources

Permettre à l'utilisateur de créer des projets et d'y ajouter des sources variées.

#### F2.1 — Création de projet

**User Stories** :
- **US-2.1.1** En tant qu'utilisateur, je veux créer un nouveau projet avec un nom, afin d'organiser mes podcasts.

**Critères d'acceptation** :
- Le nom du projet est obligatoire (1–100 caractères)
- Le projet apparaît immédiatement dans la liste des projets
- Le statut initial est « draft »

**Notes techniques** :
- Insertion dans la table projects via l'API, user_id déduit du token JWT

#### F2.2 — Ajout de sources URL

**User Stories** :
- **US-2.2.1** En tant qu'utilisateur, je veux coller une ou plusieurs URLs dans mon projet, afin d'alimenter le podcast avec du contenu web.

**Critères d'acceptation** :
- L'URL est validée (format, accessibilité) avant ingestion
- Le contenu est extrait et affiché sous forme de résumé (titre + nb de mots extraits)
- En cas d'échec (URL inaccessible, contenu vide), un message d'erreur spécifique est affiché
- La source en erreur n'empêche pas l'ajout d'autres sources

**Notes techniques** :
- Extraction via Jina Reader (r.jina.ai) pour le scraping, fallback sur fetch + cheerio
- Le contenu est normalisé en markdown et stocké dans raw_content

#### F2.3 — Ajout de sources PDF

**User Stories** :
- **US-2.3.1** En tant qu'utilisateur, je veux uploader un ou plusieurs fichiers PDF, afin d'intégrer des documents longs dans mon podcast.

**Critères d'acceptation** :
- Les formats acceptés sont .pdf uniquement
- La taille maximale est de 50 pages (tier gratuit) / 200 pages (premium)
- Un indicateur de progression est affiché pendant l'upload
- Le PDF est traité et un résumé (titre + nb de pages + nb de mots) est affiché
- Les PDFs scannés (images) sont traités via OCR

**Notes techniques** :
- Upload vers Supabase Storage, puis extraction via Mistral Pixtral (vision OCR)
- Le contenu extrait est stocké en markdown dans raw_content
- Chunking intelligent par sections/titres détectés dans le PDF

#### F2.4 — Visualisation et gestion des sources

**User Stories** :
- **US-2.4.1** En tant qu'utilisateur, je veux voir la liste des sources ajoutées avec leur statut, afin de savoir quelles sources ont été correctement ingérées.
- **US-2.4.2** En tant qu'utilisateur, je veux supprimer une source de mon projet, afin de retirer du contenu non pertinent.

**Critères d'acceptation** :
- Chaque source affiche : type (URL/PDF), titre/URL, statut (en cours, ingéré, erreur), nb de mots extraits
- La suppression est immédiate avec confirmation
- Le projet doit avoir au moins 1 source pour passer à l'étape de configuration

### E3 — Configuration du podcast

Permettre à l'utilisateur de paramétrer le ton, la durée et le nombre de chapitres.

#### F3.1 — Choix du ton

**User Stories** :
- **US-3.1.1** En tant qu'utilisateur, je veux choisir le ton du podcast parmi une liste, afin d'obtenir un podcast qui correspond à mon style d'écoute.

**Critères d'acceptation** :
- 4 tons disponibles au MVP : Pédagogue, Débat, Vulgarisation, Interview
- Chaque ton est illustré par une courte description (1 ligne)
- Le choix est obligatoire et modifiable tant que la génération n'est pas lancée
- Le ton sélectionné influence le prompt système envoyé au LLM

**Notes techniques** :
- Le ton est mappé à un prompt template spécifique stocké côté serveur
- Chaque prompt template définit le comportement de chaque speaker (hôte, expert)

#### F3.2 — Choix de la durée cible

**User Stories** :
- **US-3.2.1** En tant qu'utilisateur, je veux sélectionner une durée cible pour le podcast, afin d'adapter le contenu à mon temps disponible.

**Critères d'acceptation** :
- 3 options : 5 minutes, 15 minutes, 30 minutes
- La durée est indicative (±20% de tolérance)
- La durée influence la longueur du scénario généré (nombre de tokens cible)

**Notes techniques** :
- Mapping durée → nombre de mots cible dans le scénario (~150 mots/minute pour du parlé)
- 5 min ≈ 750 mots, 15 min ≈ 2250 mots, 30 min ≈ 4500 mots

#### F3.3 — Choix du nombre de chapitres

**User Stories** :
- **US-3.3.1** En tant qu'utilisateur, je veux définir le nombre de chapitres souhaités, afin de structurer le podcast selon mes préférences.

**Critères d'acceptation** :
- Sélection via un slider ou des boutons : de 1 à 6 chapitres
- Le nombre de chapitres est contraint par la durée (ex : max 2 chapitres pour 5 min)
- La valeur par défaut est calculée automatiquement selon la durée (1 pour 5 min, 3 pour 15 min, 5 pour 30 min)

**Notes techniques** :
- La durée par chapitre = durée totale / nb de chapitres. Servira de contrainte au LLM.

### E4 — Génération du scénario & Prévisualisation

Générer un script structuré à partir des sources et le présenter à l'utilisateur pour validation.

#### F4.1 — Génération du plan de chapitres

**User Stories** :
- **US-4.1.1** En tant qu'utilisateur, je veux voir un plan de chapitres généré automatiquement à partir de mes sources, afin de valider la structure avant la génération complète.

**Critères d'acceptation** :
- Le plan affiche pour chaque chapitre : titre + résumé (2–3 lignes)
- Le plan est généré en moins de 30 secondes
- Un spinner de chargement est affiché pendant la génération du plan

**Notes techniques** :
- Appel LLM Mistral avec le contenu des sources concaténé + prompt de structuration
- Le LLM reçoit : contenu des sources, ton choisi, durée cible, nombre de chapitres
- Réponse attendue en JSON structuré (mode JSON de Mistral)

#### F4.2 — Réorganisation des chapitres

**User Stories** :
- **US-4.2.1** En tant qu'utilisateur, je veux réordonner les chapitres par drag & drop, afin d'organiser le flux narratif à ma convenance.
- **US-4.2.2** En tant qu'utilisateur, je veux supprimer un chapitre du plan, afin de retirer une partie qui ne m'intéresse pas.

**Critères d'acceptation** :
- Le drag & drop est fluide et natif (geste tactile)
- La suppression demande une confirmation rapide (swipe ou bouton)
- Il doit rester au moins 1 chapitre pour lancer la génération
- L'ordre final est sauvegardé dans le champ position de chaque chapitre

**Notes techniques** :
- Utiliser react-native-draggable-flatlist pour le drag & drop
- La mise à jour des positions est batchée en un seul appel API

#### F4.3 — Génération du scénario complet

**User Stories** :
- **US-4.3.1** En tant qu'utilisateur, je veux lancer la génération du scénario complet en validant le plan, afin d'obtenir un script prêt pour la synthèse vocale.

**Critères d'acceptation** :
- Le bouton « Générer le podcast » est clairement visible
- L'utilisateur est informé que la génération prendra quelques minutes
- Le statut du projet passe à « processing »
- L'utilisateur peut quitter l'écran / l'app

**Notes techniques** :
- Le scénario est généré chapitre par chapitre, chaque chapitre recevant le résumé des chapitres précédents pour assurer la cohérence
- Format du script JSON : `[{speaker: 'host'|'expert', text: '...', tone: '...'}]`
- Le job est placé dans la queue BullMQ

### E5 — Génération audio (TTS)

Convertir le scénario textuel en fichiers audio MP3 avec deux voix distinctes.

#### F5.1 — Synthèse vocale par chapitre

**User Stories** :
- **US-5.1.1** En tant que système, je veux générer un fichier MP3 par chapitre à partir du scénario, afin de produire le podcast final.

**Critères d'acceptation** :
- Chaque réplique est synthétisée avec la voix correspondante (hôte ou expert)
- Les répliques sont concaténées avec un court silence entre elles (~300ms)
- Le fichier final est en MP3 128kbps
- Le fichier est stocké dans Supabase Storage et le chemin est enregistré dans chapters.audio_path
- La durée de l'audio est enregistrée dans chapters.audio_duration

**Notes techniques** :
- 2 voix préconfigurées côté serveur : 1 voix homme (hôte), 1 voix femme (expert) ou inversement
- Appels TTS séquentiels par réplique, puis concaténation via ffmpeg
- Gestion des erreurs : retry 3x par réplique, puis échec du chapitre

#### F5.2 — Pipeline de génération complet

**User Stories** :
- **US-5.2.1** En tant que système, je veux orchestrer la génération du scénario puis de l'audio pour tous les chapitres, afin de livrer le podcast complet.

**Critères d'acceptation** :
- Le pipeline suit l'ordre : génération du scénario complet → TTS chapitre par chapitre → mise à jour du statut
- En cas d'échec partiel, le statut du projet passe à « error » avec détail
- Le job est idempotent : relancer ne crée pas de doublons
- La durée totale estimée : 2–5 minutes pour un podcast de 15 minutes

**Notes techniques** :
- Worker BullMQ dédié, avec retry policy et dead letter queue
- Chaque étape émet un domain event (ScenarioGenerated, ChapterAudioGenerated, PodcastReady)

### E6 — Lecteur audio & Playlist

Permettre l'écoute du podcast généré directement dans l'application.

#### F6.1 — Lecteur audio intégré

**User Stories** :
- **US-6.1.1** En tant qu'utilisateur, je veux écouter mon podcast dans l'application, afin de consommer le contenu sans quitter l'app.

**Critères d'acceptation** :
- Le lecteur affiche : titre du chapitre en cours, progression (barre + temps), boutons play/pause/précédent/suivant
- La lecture continue en arrière-plan (app minimisée, écran verrouillé)
- Les contrôles sont accessibles depuis le lock screen et le centre de contrôle (iOS/Android)
- La position de lecture est sauvegardée pour reprendre plus tard

**Notes techniques** :
- Utiliser expo-av ou react-native-track-player pour le lecteur
- react-native-track-player est recommandé pour la lecture en arrière-plan et les contrôles système

#### F6.2 — Navigation par chapitres (playlist)

**User Stories** :
- **US-6.2.1** En tant qu'utilisateur, je veux naviguer entre les chapitres du podcast, afin de sauter directement au sujet qui m'intéresse.

**Critères d'acceptation** :
- La liste des chapitres est affichée sous le lecteur (titre + durée)
- Taper sur un chapitre lance sa lecture
- Le chapitre en cours est visuellement mis en évidence
- La transition entre chapitres est automatique (« autoplay »)

### E7 — Export & Partage

Permettre l'export des fichiers audio et le partage via lien public.

#### F7.1 — Export MP3

**User Stories** :
- **US-7.1.1** En tant qu'utilisateur, je veux télécharger les fichiers MP3 de mon podcast, afin de les écouter hors ligne ou dans un autre lecteur.

**Critères d'acceptation** :
- Un bouton « Exporter » est disponible sur l'écran du projet (statut « ready » uniquement)
- L'export télécharge un fichier MP3 par chapitre
- Les fichiers sont nommés : `[NomProjet] - Chapitre [N] - [TitreChapitre].mp3`
- Le téléchargement utilise le système natif de partage/sauvegarde du device

**Notes techniques** :
- URL signée temporaire (1h) générée via Supabase Storage pour chaque fichier

#### F7.2 — Partage par lien public

**User Stories** :
- **US-7.2.1** En tant qu'utilisateur, je veux générer un lien de partage public pour mon podcast, afin de le faire découvrir à d'autres personnes.

**Critères d'acceptation** :
- Un bouton « Partager » génère un lien unique (slug court)
- Le lien ouvre une page web responsive avec un mini-lecteur audio
- La page affiche : titre du projet, liste des chapitres, lecteur audio
- L'utilisateur peut désactiver le lien à tout moment
- Le partage utilise le Share Sheet natif du device (copier, envoyer par message, etc.)

**Notes techniques** :
- Page web statique ou SSR légère hébergée sur Vercel/Cloudflare Pages
- Le slug est généré via nanoid (collision-resistant, URL-safe)
- Les fichiers audio sont servis via des URLs signées longue durée pour les liens publics

### E8 — Freemium & Quotas

Gérer les limites du tier gratuit et l'abonnement premium.

#### F8.1 — Gestion des quotas (tier gratuit)

**User Stories** :
- **US-8.1.1** En tant qu'utilisateur gratuit, je veux voir mes limites et ma consommation, afin de savoir quand je dois upgrader.

**Critères d'acceptation** :
- Limites du tier gratuit : 3 projets sauvegardés, 3 sources par projet, 50 pages max par PDF, 15 min max de durée audio
- Les limites sont affichées dans les paramètres du compte
- Quand une limite est atteinte, une modale explique la limite et propose l'upgrade
- Le dépassement est bloqué (pas de dégradation silencieuse)

**Notes techniques** :
- Les quotas sont vérifiés côté serveur (jamais côté client uniquement)
- Middleware de vérification de quota sur les routes concernées

#### F8.2 — Abonnement premium

**User Stories** :
- **US-8.2.1** En tant qu'utilisateur, je veux souscrire à l'abonnement premium, afin de débloquer les limites étendues.

**Critères d'acceptation** :
- Limites premium : 20 projets, 10 sources par projet, 200 pages par PDF, 30 min de durée audio
- Le paiement est géré via les achats in-app (App Store / Google Play)
- Le changement de tier est effectif immédiatement après confirmation du paiement
- L'annulation prend effet à la fin de la période en cours

**Notes techniques** :
- Utiliser RevenueCat pour gérer les abonnements cross-platform (simplifie énormément la gestion IAP)
- Webhook RevenueCat → mise à jour du champ tier dans la table users

### E9 — Notifications Push

Informer l'utilisateur quand son podcast est prêt.

#### F9.1 — Notification de podcast prêt

**User Stories** :
- **US-9.1.1** En tant qu'utilisateur, je veux recevoir une notification quand mon podcast est généré, afin de revenir dans l'app au bon moment.

**Critères d'acceptation** :
- La notification affiche : « Votre podcast [NomProjet] est prêt ! »
- Taper sur la notification ouvre directement le projet concerné
- En cas d'échec de génération : « Un problème est survenu avec [NomProjet]. Appuyez pour réessayer. »
- La permission de notification est demandée au moment du premier lancement de génération (pas au premier lancement de l'app)

**Notes techniques** :
- Expo Notifications (expo-notifications) pour la gestion cross-platform
- Le push token est stocké dans une table device_tokens liée à l'utilisateur
- Le worker BullMQ envoie la notification à la fin du pipeline

### E10 — Infrastructure & DevOps

Mettre en place l'infrastructure, le CI/CD et les outils de monitoring.

#### F10.1 — Structure monorepo

**User Stories** :
- **US-10.1.1** En tant que développeur, je veux travailler dans un monorepo bien structuré, afin de partager du code et des types entre front et back.

**Critères d'acceptation** :
- Structure : apps/mobile, apps/api, packages/shared, packages/domain
- Le package shared exporte les types, DTOs, enums et constantes partagés
- Le package domain contient les entités, value objects et interfaces DDD
- pnpm workspaces pour la résolution de dépendances
- Turborepo pour le cache et l'orchestration des builds

#### F10.2 — CI/CD

**User Stories** :
- **US-10.2.1** En tant que développeur, je veux avoir un pipeline CI/CD automatisé, afin de déployer en confiance.

**Critères d'acceptation** :
- Lint + type-check + tests sur chaque PR
- Build de l'API et déploiement automatique sur push main
- Build mobile via EAS Build (Expo Application Services)
- Les tests Gherkin (BDD) font partie du pipeline CI

**Notes techniques** :
- GitHub Actions avec cache Turborepo
- Déploiement API : Railway, Render ou Fly.io (Node.js + Redis)
- Déploiement mobile : EAS Submit vers App Store / Google Play

#### F10.3 — Monitoring & Observabilité

**User Stories** :
- **US-10.3.1** En tant que développeur, je veux monitorer les erreurs et les performances, afin de détecter et résoudre les problèmes rapidement.

**Critères d'acceptation** :
- Les erreurs sont capturées et remontées (Sentry ou équivalent)
- Les métriques clés sont trackées : temps de génération, taux d'échec, coût par épisode
- Les jobs BullMQ ont un dashboard de suivi (Bull Board)

## 8. Limites & Hors scope MVP

| Fonctionnalité | Statut | Horizon |
|----------------|--------|---------|
| Édition manuelle du scénario (texte) | Hors scope | V2 |
| Choix des voix par l'utilisateur | Hors scope | V2 |
| Regénération d'un chapitre individuel | Hors scope | V2 |
| Interaction temps réel pendant l'écoute | Hors scope | V3+ (Moshi / Kyutai) |
| Multilingue (anglais, etc.) | Hors scope | V2 |
| Export WAV / autres formats | Hors scope | V2 |
| Clonage de voix personnalisé | Hors scope | V3 |
| Version web (desktop) | Hors scope | V2 |
| API publique | Hors scope | V3 |

## 9. Living Documentation

La living documentation est une pratique où la documentation est générée à partir du code et des tests, garantissant qu'elle est toujours à jour.

### 9.1 Frontend (BDD)

Chaque feature est décrite en scénarios Gherkin dans des fichiers `.feature` co-localisés avec les écrans correspondants. Exemple :

```gherkin
Feature: Création de projet
  Scenario: L'utilisateur crée un projet avec un nom valide
    Given je suis connecté
    When je saisis « Mon podcast » comme nom de projet
    And je valide la création
    Then le projet « Mon podcast » apparaît dans ma liste
    And son statut est « draft »
```

Ces scénarios sont exécutés comme tests E2E (Detox + Jest-Cucumber) et génèrent un rapport HTML navigable.

### 9.2 Backend (DDD)

- Chaque bounded context a un fichier CONTEXT.md décrivant ses responsabilités et ses frontières
- Le glossaire ubiquitaire est généré depuis les annotations JSDoc des entités et value objects
- Les domain events sont documentés par leur schéma TypeScript

### 9.3 ADR (Architecture Decision Records)

Chaque décision technique significative est documentée dans un fichier ADR stocké dans `docs/adr/` du monorepo. Format : Titre, Contexte, Décision, Conséquences.

Exemples d'ADR initiaux :
- ADR-001 : Choix de Turborepo comme outil de monorepo
- ADR-002 : Choix de Supabase comme BaaS
- ADR-003 : Choix de Mistral comme fournisseur LLM
- ADR-004 : Choix de BullMQ pour les jobs asynchrones
- ADR-005 : Séparation front BDD / back DDD

## 10. Structure Monorepo

Arborescence cible du monorepo :

```
/
├── apps/
│   ├── mobile/                    # React Native Expo
│   │   ├── src/
│   │   │   ├── features/          # Organisé par feature (BDD)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── screens/
│   │   │   │   │   ├── components/
│   │   │   │   │   ├── hooks/
│   │   │   │   │   └── auth.feature   # Gherkin
│   │   │   │   ├── project/
│   │   │   │   ├── player/
│   │   │   │   └── sharing/
│   │   │   ├── navigation/
│   │   │   └── shared/            # Composants UI réutilisables
│   │   ├── app.json
│   │   └── package.json
│   │
│   ├── api/                       # Backend Node.js TS
│   │   ├── src/
│   │   │   ├── application/       # Use cases
│   │   │   ├── domain/            # Entités, VO, events
│   │   │   ├── infrastructure/    # Supabase, Mistral, Fish Audio
│   │   │   ├── interfaces/        # Routes HTTP, controllers
│   │   │   └── workers/           # Jobs BullMQ
│   │   └── package.json
│   │
│   └── web/                       # Mini-lecteur de partage
│       ├── src/
│       └── package.json
│
├── packages/
│   ├── shared/                    # Types, DTOs, enums, constantes
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── dtos/
│   │   │   ├── enums/
│   │   │   └── constants/
│   │   └── package.json
│   │
│   └── domain/                    # Entités DDD partagées
│       ├── src/
│       └── package.json
│
├── docs/
│   ├── adr/                       # Architecture Decision Records
│   ├── glossary/                  # Glossaire ubiquitaire (généré)
│   └── living-doc/                # Rapports Cucumber (générés)
│
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 11. Glossaire

| Terme | Définition |
|-------|------------|
| Projet | Unité de travail regroupant des sources, une configuration et un podcast généré |
| Source | Document d'entrée (URL ou PDF) qui alimente le contenu du podcast |
| Ton | Style conversationnel du podcast (pédagogue, débat, vulgarisation, interview) |
| Chapitre | Section thématique du podcast, correspondant à un fichier audio distinct |
| Scénario (Script) | Texte structuré décrivant les échanges entre les speakers, prêt pour la synthèse vocale |
| Speaker | Voix dans le podcast. MVP : 2 speakers fixes (Hôte + Expert) |
| Plan | Étape intermédiaire affichant la structure des chapitres avant génération complète |
| Pipeline | Chaîne de traitement : ingestion → scénario → TTS → podcast |
| TTS | Text-to-Speech — synthèse vocale transformant le texte en audio |
| BDD | Behavior-Driven Design — approche de développement pilotée par les comportements (Gherkin) |
| DDD | Domain-Driven Design — modélisation du code autour du métier |
| Living Documentation | Documentation générée à partir du code, toujours synchronisée |
| ADR | Architecture Decision Record — document traçant un choix technique et sa justification |
| Ralph Loop | Méthode de développement itératif piloté par IA, alimenté par un PRD découpé en user stories |
| Bounded Context | Périmètre fonctionnel autonome dans le DDD (ex : Identity, Project, Audio) |

---

*Fin du document — PRD v1.0*
