# TASK-007 — Mobile Auth Screens (apps/mobile)

**Statut** : `done`
**Epic** : E1 — Authentification & Gestion de compte
**User Story** : US-1.1.1, US-1.1.2, US-1.2.1, US-1.2.2, US-1.3.1
**Dépendances** : TASK-006

## Contexte
Implémenter les écrans d'authentification de l'app mobile avec l'approche BDD (Gherkin). C'est le premier feature set mobile — il faut aussi poser la navigation et la structure features/.

## User Story
En tant qu'utilisateur mobile, je veux pouvoir m'inscrire, me connecter et gérer mon compte, afin d'utiliser l'application.

## Critères d'acceptation
- [ ] Scénarios Gherkin pour chaque feature (auth.feature)
- [ ] Écran d'inscription (email + mot de passe + boutons OAuth)
- [ ] Écran de connexion (email + mot de passe + boutons OAuth)
- [ ] Navigation : auth stack (non connecté) vs main stack (connecté)
- [ ] Gestion des tokens (Supabase JS client + SecureStore)
- [ ] Écran paramètres avec bouton de déconnexion
- [ ] Modale de suppression de compte (saisir "SUPPRIMER")
- [ ] Validation du formulaire côté client (email format, password strength)
- [ ] Messages d'erreur explicites (email déjà pris, identifiants invalides)
- [ ] Tests BDD passent (Jest-Cucumber)

## Sous-tâches
- [ ] Écrire les scénarios Gherkin (auth.feature)
- [ ] Installer les dépendances navigation (React Navigation)
- [ ] Créer la structure features/auth/ (screens/, components/, hooks/)
- [ ] Implémenter AuthNavigator (auth stack vs main stack)
- [ ] RED: Test écran inscription (BDD)
- [ ] GREEN: Implémenter RegisterScreen
- [ ] RED: Test écran connexion (BDD)
- [ ] GREEN: Implémenter LoginScreen
- [ ] RED: Test déconnexion (BDD)
- [ ] GREEN: Implémenter le bouton logout dans Settings
- [ ] RED: Test suppression de compte (BDD)
- [ ] GREEN: Implémenter la modale de suppression
- [ ] Configurer Supabase JS client + SecureStore pour les tokens
- [ ] REFACTOR: Extraire les hooks réutilisables (useAuth)

## Notes techniques
- BDD : chaque scénario Gherkin dans auth.feature est un test exécutable
- Navigation : React Navigation avec 2 stacks (AuthStack et MainStack)
- Tokens : Supabase JS gère les refresh tokens, on les persiste via expo-secure-store
- OAuth : Supabase Auth + expo-auth-session pour Google/Apple
- La validation mot de passe réplique les règles du Password VO (8+ chars, 1 maj, 1 chiffre)
- Scénarios Gherkin en français (cohérent avec le PRD)

## Scénarios Gherkin (draft)

```gherkin
Feature: Authentification

  Scenario: Inscription avec email et mot de passe valides
    Given je suis sur l'écran d'inscription
    When je saisis "test@example.com" comme email
    And je saisis "Password1" comme mot de passe
    And je valide l'inscription
    Then mon compte est créé
    And je suis redirigé vers l'écran principal

  Scenario: Inscription avec email déjà utilisé
    Given je suis sur l'écran d'inscription
    And un compte existe avec l'email "test@example.com"
    When je saisis "test@example.com" comme email
    And je saisis "Password1" comme mot de passe
    And je valide l'inscription
    Then je vois un message d'erreur "Cet email est déjà utilisé"

  Scenario: Connexion avec identifiants valides
    Given je suis sur l'écran de connexion
    And j'ai un compte avec l'email "test@example.com"
    When je saisis "test@example.com" comme email
    And je saisis "Password1" comme mot de passe
    And je valide la connexion
    Then je suis redirigé vers l'écran principal
    And je vois mes projets

  Scenario: Déconnexion
    Given je suis connecté
    And je suis sur l'écran des paramètres
    When je clique sur "Se déconnecter"
    Then je suis redirigé vers l'écran de connexion

  Scenario: Suppression de compte
    Given je suis connecté
    And je suis sur l'écran des paramètres
    When je clique sur "Supprimer mon compte"
    And je saisis "SUPPRIMER" dans la modale de confirmation
    And je confirme la suppression
    Then mon compte est supprimé
    And je suis redirigé vers l'écran de connexion
```
