# Zeste MVP — Ce qu'il reste à faire

> Document mis à jour le 24/02/2026 — après tests E2E réussis en local.
> 322 tests verts, pipeline complet fonctionnel (mobile → API → Mistral → Fish Audio → Supabase Storage).

---

## Statut actuel

### Fonctionnel et testé E2E en local
- [x] Inscription / connexion (mobile → backend → Supabase Auth + public.users)
- [x] Création de projet
- [x] Ajout de source URL (ingestion via Jina Reader)
- [x] Configuration du podcast (ton, durée, nombre de chapitres)
- [x] Génération du plan de chapitres (Mistral API)
- [x] Génération du scénario complet (Mistral API, ~60s pour 5 chapitres)
- [x] Génération audio TTS (Fish Audio API → Supabase Storage)
- [x] Lecture audio réelle (expo-av, barre de progression, auto-avance, background audio)
- [x] Création de lien de partage
- [x] Déconnexion + auto-déconnexion sur token expiré

### Bugs corrigés pendant les tests E2E
- [x] RLS violation → repositories utilisent le service role client
- [x] FK constraint users → auto-création public.users dans le middleware auth
- [x] Mobile signup bypass backend → appel backend /api/auth/register avec displayName
- [x] Body vide en POST → Content-Type conditionnel
- [x] Chapter IDs non-UUID → randomUUID()
- [x] Shared link IDs non-UUID → randomUUID()
- [x] audioPath/audioDuration manquants dans les serializers chapitre
- [x] Bouton "Chapitres" invisible en draft → bouton "Générer le podcast" dès qu'il y a des sources

---

## 1. Configuration Supabase (déjà fait si tu testes en local)

### 1.1 Appliquer la migration SQL

```bash
# Option A : via le dashboard Supabase → SQL Editor → coller le contenu de :
supabase/migrations/00001_initial_schema.sql

# Option B : via la CLI Supabase (si installée)
supabase db push
```

### 1.2 Créer le bucket Storage

Dashboard Supabase → **Storage** → **New bucket** : `audio` (privé).

### 1.3 Variables d'environnement

```bash
# apps/api/.env
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
MISTRAL_API_KEY=...
FISH_AUDIO_API_KEY=...
FISH_AUDIO_HOST_VOICE_ID=...
FISH_AUDIO_EXPERT_VOICE_ID=...
JINA_API_KEY=...

# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## 2. Fonctionnel à implémenter

### 2.1 BullMQ workers (priorité haute)

Actuellement la génération est **synchrone** (scénario ~60s, audio potentiellement plusieurs minutes). Pour la production :

1. Installer Redis + BullMQ : `pnpm --filter @zeste/api add bullmq`
2. Créer les workers :
   - `GenerateScenarioWorker` — génère le scénario en background
   - `GenerateAudioWorker` — génère l'audio en background
3. Les routes deviennent de vrais dispatchers : enqueue un job, retournent 202 immédiatement
4. Les workers envoient une push notification quand c'est terminé
5. Ajouter du polling ou WebSocket côté mobile pour suivre la progression

### 2.2 Quota enforcement (priorité moyenne)

Le `QuotaService` existe (`apps/api/src/shared/services/quota.ts`) avec 3 méthodes statiques, mais il n'est **pas encore appelé** dans les use cases. Il faut l'intégrer dans :

- `CreateProject` → `QuotaService.checkProjectQuota(tier, count)`
- `AddSource` → `QuotaService.checkSourceQuota(tier, count)`
- `ConfigureProject` → `QuotaService.checkDurationQuota(tier, duration)`

### 2.3 Ingestion PDF (priorité basse)

`JinaIngestionService.ingestPdf()` lance `throw "not implemented"`. Pour l'implémenter :

1. Utiliser Mistral Pixtral (vision API) pour l'OCR des PDF scannés
2. Ou `pdf-parse` pour les PDF texte natifs
3. Ajouter un upload vers Supabase Storage avant l'ingestion

---

## 3. Déploiement

### 3.1 API Backend

Options recommandées : **Railway**, **Render**, ou **Fly.io**.

```dockerfile
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

> Note : il faudra ajouter un script `build` dans `apps/api/package.json` qui compile le TS, et un `REDIS_URL` quand BullMQ sera intégré.

### 3.2 Mobile (EAS Build)

1. Installer EAS CLI : `npm install -g eas-cli`
2. Créer `apps/mobile/eas.json`
3. Build : `cd apps/mobile && eas build --platform ios`
4. Submit : `eas submit --platform ios`
5. Mettre `EXPO_PUBLIC_API_URL` vers l'URL de prod

### 3.3 Web Mini-Player

Le workspace `apps/web/` est un squelette vide. Pour le MVP :

1. Créer une page qui fetch `GET /api/shared/:slug` (route publique existante)
2. Afficher : titre du projet, liste des chapitres, lecteur HTML5 `<audio>`
3. Déployer sur Vercel : `vercel deploy`

---

## 4. Intégrations tierces manquantes

### 4.1 Push Notifications (Expo Notifications)

Nécessaire quand BullMQ sera en place pour notifier la fin de génération.

### 4.2 RevenueCat (abonnements premium)

1. Configurer les produits IAP sur App Store Connect + Google Play Console
2. `pnpm --filter @zeste/mobile add react-native-purchases`
3. Implémenter l'écran d'abonnement
4. Webhook `POST /api/webhooks/revenuecat` pour mettre à jour `users.tier`

### 4.3 Sentry (monitoring)

Pour la production : monitoring des erreurs API et crashs mobile.

---

## 5. CI/CD à compléter

Le workflow GitHub Actions fait déjà typecheck + tests. Il manque :

- **Lint** : ajouter `pnpm -r lint` au pipeline
- **Deploy API** : déploiement automatique sur push to main
- **Build mobile** : EAS Build sur tag/release
- **Deploy web** : deploy Vercel sur push to main

---

## 6. Checklist récapitulative

### Fait
- [x] Migration SQL appliquée
- [x] Bucket `audio` créé
- [x] Clés API configurées (Mistral, Fish Audio, Jina, Supabase)
- [x] Pipeline E2E testé (mobile → API → LLM → TTS → Storage → Playback)
- [x] Lecture audio réelle avec expo-av
- [x] Bugs E2E corrigés (RLS, FK, UUIDs, serializers, UX flow)

### Obligatoire pour la production
- [ ] Ajouter BullMQ + Redis pour les jobs asynchrones
- [ ] Intégrer les quotas dans les use cases
- [ ] Déployer l'API sur un provider cloud
- [ ] Configurer EAS Build pour le mobile
- [ ] Mettre `EXPO_PUBLIC_API_URL` vers l'URL de prod

### Nice-to-have (post-MVP)
- [ ] Ingestion PDF (Mistral Pixtral)
- [ ] Fallback Cheerio si Jina échoue
- [ ] Web mini-player (apps/web)
- [ ] Push notifications
- [ ] RevenueCat (abonnements)
- [ ] Sentry (monitoring)
- [ ] Tests d'intégration Supabase local
- [ ] Bull Board (dashboard des jobs)
