# Zeste MVP — Ce qu'il reste à faire

> Document généré le 24/02/2026 — état du code après TASK-026.
> 317 tests verts, 26 tâches terminées, pipeline complet codé.

---

## 1. Configuration Supabase

### 1.1 Appliquer la migration SQL

```bash
# Option A : via le dashboard Supabase → SQL Editor → coller le contenu de :
supabase/migrations/00001_initial_schema.sql

# Option B : via la CLI Supabase (si installée)
supabase db push
```

Ce script crée 6 tables (`users`, `projects`, `sources`, `chapters`, `shared_links`, `device_tokens`), les enums PostgreSQL, les index, le trigger `updated_at` et les policies RLS.

### 1.2 Créer le bucket Storage

Dans le dashboard Supabase → **Storage** → **New bucket** :

| Bucket | Nom | Public | Usage |
|--------|-----|--------|-------|
| Audio | `audio` | Non | Fichiers MP3 générés par chapitre |

Le code utilise le bucket `audio` avec le pattern de chemin : `{projectId}/{chapterId}.mp3`.

> Le bucket PDF (`projects-pdfs`) peut être créé plus tard quand l'ingestion PDF sera implémentée.

### 1.3 Vérifier les RLS policies

Les policies sont dans la migration SQL. Vérifie qu'elles sont bien activées :
- Chaque utilisateur ne voit que ses propres projets/sources/chapitres
- Les `shared_links` sont accessibles publiquement via le slug (lecture seule)

---

## 2. Configuration Fish Audio (voix)

Tu as besoin de **2 voice IDs** Fish Audio pour les deux intervenants du podcast.

1. Va sur [fish.audio](https://fish.audio)
2. Choisis ou crée 2 voix distinctes (homme/femme, ou 2 voix différentes)
3. Copie les **reference IDs** de chaque voix
4. Ajoute dans `apps/api/.env` :

```env
FISH_AUDIO_HOST_VOICE_ID=<reference_id_voix_hôte>
FISH_AUDIO_EXPERT_VOICE_ID=<reference_id_voix_expert>
```

---

## 3. Tester le pipeline de bout en bout

Une fois la config faite, tu peux tester manuellement le flow complet :

```bash
# 1. Lancer l'API
cd apps/api && pnpm start

# 2. Créer un utilisateur (via Supabase Auth dashboard ou API)

# 3. Créer un projet
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mon premier podcast"}'

# 4. Ajouter une source URL
curl -X POST http://localhost:3000/api/projects/<projectId>/sources \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "url", "url": "https://fr.wikipedia.org/wiki/Intelligence_artificielle"}'

# 5. Configurer le podcast
curl -X PATCH http://localhost:3000/api/projects/<projectId>/configure \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tone": "pedagogue", "targetDuration": 5, "chapterCount": 1}'

# 6. Générer le plan de chapitres (appelle Mistral)
curl -X POST http://localhost:3000/api/projects/<projectId>/generate-plan \
  -H "Authorization: Bearer <token>"

# 7. Générer le scénario complet (appelle Mistral)
curl -X POST http://localhost:3000/api/projects/<projectId>/generate \
  -H "Authorization: Bearer <token>"

# 8. Générer l'audio (appelle Fish Audio + Supabase Storage)
curl -X POST http://localhost:3000/api/projects/<projectId>/generate-audio \
  -H "Authorization: Bearer <token>"
```

---

## 4. Fonctionnel à implémenter

### 4.1 Lecture audio réelle (priorité haute)

Le `PlayerScreen` affiche l'UI (playlist, boutons play/pause/next/prev) mais ne lit pas réellement l'audio. Il faut :

1. Installer `expo-av` : `pnpm --filter @zeste/mobile add expo-av`
2. Ajouter une route API `GET /api/projects/:id/chapters/:chapterId/audio` qui retourne une signed URL
3. Dans `PlayerScreen`, utiliser `Audio.Sound` de `expo-av` pour charger et lire les URLs signées
4. Gérer le background audio (déjà configuré dans `app.json` : `UIBackgroundModes: ["audio"]`)

### 4.2 BullMQ workers (priorité haute)

Actuellement la génération audio est **synchrone** dans la route HTTP (202 mais bloquant). Pour la production :

1. Installer Redis + BullMQ : `pnpm --filter @zeste/api add bullmq`
2. Créer les workers :
   - `GenerateScenarioWorker` — génère le scénario en background
   - `GenerateAudioWorker` — génère l'audio en background
3. Les routes deviennent de vrais dispatchers : elles enqueulent un job et retournent 202 immédiatement
4. Les workers envoient une push notification quand c'est terminé

### 4.3 Quota enforcement (priorité moyenne)

Le `QuotaService` existe (`apps/api/src/shared/services/quota.ts`) avec 3 méthodes statiques, mais il n'est **pas encore appelé** dans les use cases. Il faut l'intégrer dans :

- `CreateProject` → `QuotaService.checkProjectQuota(tier, count)`
- `AddSource` → `QuotaService.checkSourceQuota(tier, count)`
- `ConfigureProject` → `QuotaService.checkDurationQuota(tier, duration)`

### 4.4 Ingestion PDF (priorité basse)

`JinaIngestionService.ingestPdf()` lance `throw "not implemented"`. Pour l'implémenter :

1. Utiliser Mistral Pixtral (vision API) pour l'OCR des PDF scannés
2. Ou `pdf-parse` pour les PDF texte natifs
3. Ajouter un upload vers Supabase Storage avant l'ingestion

---

## 5. Déploiement

### 5.1 API Backend

Options recommandées : **Railway**, **Render**, ou **Fly.io**.

```dockerfile
# Créer un Dockerfile à la racine ou dans apps/api/
FROM node:20-slim
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @zeste/shared build
RUN pnpm --filter @zeste/domain build
EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
```

Variables d'environnement à configurer sur le provider :

```
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
MISTRAL_API_KEY=...
FISH_AUDIO_API_KEY=...
FISH_AUDIO_HOST_VOICE_ID=...
FISH_AUDIO_EXPERT_VOICE_ID=...
JINA_API_KEY=...
NODE_ENV=production
PORT=3000
```

> Note : il faudra aussi ajouter un script `build` dans `apps/api/package.json` qui compile le TS, et un `REDIS_URL` quand BullMQ sera intégré.

### 5.2 Mobile (EAS Build)

1. Installer EAS CLI : `npm install -g eas-cli`
2. Créer `apps/mobile/eas.json` :

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

3. Build : `cd apps/mobile && eas build --platform ios`
4. Submit : `eas submit --platform ios`

**Pré-requis** :
- Compte Apple Developer (99$/an)
- Compte Google Play Developer (25$ one-time)
- Configurer les credentials via `eas credentials`

### 5.3 Web Mini-Player

Le workspace `apps/web/` est un squelette vide. Pour le MVP :

1. Créer une page qui fetch `GET /api/shared/:slug` (route publique existante)
2. Afficher : titre du projet, liste des chapitres, lecteur HTML5 `<audio>`
3. Déployer sur Vercel : `vercel deploy`

---

## 6. Intégrations tierces manquantes

### 6.1 Push Notifications (Expo Notifications)

1. `pnpm --filter @zeste/mobile add expo-notifications`
2. Ajouter le plugin dans `app.json`
3. Configurer FCM (Android) : créer un projet Google Cloud + clé serveur
4. Configurer APNs (iOS) : clé dans le Apple Developer Portal
5. Implémenter côté mobile : demander la permission, enregistrer le token, écouter les notifications
6. Implémenter côté API : endpoint pour enregistrer le token + appel push après génération audio

### 6.2 RevenueCat (abonnements premium)

1. Créer un compte sur [revenuecat.com](https://revenuecat.com)
2. Configurer les produits IAP sur App Store Connect + Google Play Console
3. `pnpm --filter @zeste/mobile add react-native-purchases`
4. Implémenter l'écran d'abonnement dans le mobile
5. Créer un webhook endpoint `POST /api/webhooks/revenuecat` pour mettre à jour `users.tier`

### 6.3 Sentry (monitoring)

1. Créer un projet sur [sentry.io](https://sentry.io)
2. `pnpm --filter @zeste/api add @sentry/node`
3. `pnpm --filter @zeste/mobile add @sentry/react-native` (ou `sentry-expo`)
4. Initialiser dans `server.ts` et `App.tsx`
5. Configurer les alertes : erreurs de génération, timeouts API, crashs mobile

---

## 7. CI/CD à compléter

Le workflow GitHub Actions (`.github/workflows/ci.yml`) fait déjà typecheck + tests. Il manque :

- **Lint** : ajouter `pnpm -r lint` au pipeline
- **Deploy API** : déclencher le déploiement automatique sur push to main
- **Build mobile** : déclencher un EAS Build sur tag/release
- **Deploy web** : déclencher le deploy Vercel sur push to main
- **Coverage** : reporter la couverture de tests (optionnel)

---

## 8. Checklist récapitulative

### Obligatoire pour un premier test E2E

- [ ] Appliquer la migration SQL sur Supabase
- [ ] Créer le bucket `audio` dans Supabase Storage
- [ ] Configurer les 2 voice IDs Fish Audio
- [ ] Tester le pipeline curl (étapes section 3)

### Obligatoire pour la production

- [ ] Implémenter la lecture audio réelle (`expo-av`)
- [ ] Ajouter BullMQ + Redis pour les jobs asynchrones
- [ ] Intégrer les quotas dans les use cases
- [ ] Déployer l'API sur un provider cloud
- [ ] Configurer EAS Build pour le mobile
- [ ] Mettre `EXPO_PUBLIC_API_URL` vers l'URL de prod

### Nice-to-have (post-MVP)

- [ ] Ingestion PDF (Mistral Pixtral)
- [ ] Fallback Cheerio si Jina échoue
- [ ] Web mini-player
- [ ] Push notifications
- [ ] RevenueCat (abonnements)
- [ ] Sentry (monitoring)
- [ ] Tests d'intégration Supabase local
- [ ] Bull Board (dashboard des jobs)
