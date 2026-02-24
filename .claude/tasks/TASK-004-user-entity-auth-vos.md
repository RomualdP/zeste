# TASK-004 — UserEntity + Auth Value Objects (packages/domain)

**Statut** : `done`
**Epic** : E1 — Authentification & Gestion de compte
**User Story** : US-1.1.1, US-1.3.1
**Dépendances** : Aucune

## Contexte
TASK-002 a créé les entités Project, Source, Chapter mais pas UserEntity. Il faut compléter le bounded context Identity avec UserEntity et les Value Objects nécessaires à l'authentification. SharedLinkEntity sera créé avec E7.

## User Story
En tant que développeur, je veux une entité User avec ses règles métier (tier, suppression RGPD), afin d'implémenter l'authentification et la gestion de compte.

## Critères d'acceptation
- [ ] UserEntity avec : id, email (VO), displayName, tier, createdAt
- [ ] Value Object Password (validation : 8+ chars, 1 majuscule, 1 chiffre)
- [ ] Value Object DisplayName (1-50 caractères, trim)
- [ ] Méthode UserEntity.upgradeTier() — free → premium
- [ ] Méthode UserEntity.downgradeTier() — premium → free
- [ ] Domain Event UserRegistered
- [ ] Domain Event AccountDeleted
- [ ] Tests unitaires complets (TDD)
- [ ] Export depuis packages/domain/src/index.ts

## Sous-tâches
- [ ] RED: Test Password VO (validation rules from PRD: 8+ chars, 1 uppercase, 1 digit)
- [ ] GREEN: Implémenter Password VO
- [ ] RED: Test DisplayName VO
- [ ] GREEN: Implémenter DisplayName VO
- [ ] RED: Test UserEntity (création, changement de tier)
- [ ] GREEN: Implémenter UserEntity
- [ ] RED: Test domain events (UserRegistered, AccountDeleted)
- [ ] GREEN: Implémenter les domain events
- [ ] REFACTOR: Nettoyer et mettre à jour l'index

## Notes techniques
- Bounded Context : Identity
- Le Password VO ne stocke pas le hash — il valide le format du mot de passe en clair. Le hash est géré par Supabase Auth.
- Le Password VO est utilisé uniquement côté API pour la validation avant envoi à Supabase
- UserEntity utilise Email VO existant (déjà implémenté dans TASK-002)
- L'id du UserEntity correspond à l'UUID Supabase Auth
