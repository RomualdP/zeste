Feature: Onboarding et authentification

  Scenario: Premier lancement, l'utilisateur découvre l'app puis crée un compte
    Given je lance l'app pour la première fois
    Then je vois la première slide d'onboarding "Transforme ce que tu lis en podcast"
    And je vois trois indicateurs de pagination

    When je swipe jusqu'à la dernière slide "Écoute partout"
    And je tape sur "Commencer"
    Then le flag "hasSeenOnboarding" est persisté à "true"
    And je suis redirigé vers l'écran d'authentification

    When je tape "Pas encore de compte ? Créer un compte"
    Then je vois le champ "Ton prénom"

    When je saisis "Jane", "jane@example.com", "Secret123" puis valide
    Then mon compte est créé via l'API
    And je reviens en mode connexion

  Scenario: Utilisateur déjà onboardé, connexion directe
    Given le flag "hasSeenOnboarding" vaut "true"
    When je lance l'app
    Then je vois directement l'écran d'authentification
    And je ne vois pas l'onboarding

  Scenario: Saut de l'onboarding via "Passer"
    Given je suis sur la première slide d'onboarding
    When je tape sur "Passer"
    Then le flag "hasSeenOnboarding" est persisté à "true"
    And je suis redirigé vers l'écran d'authentification

  Scenario: Format d'email invalide
    Given je suis sur l'écran d'authentification en mode connexion
    When je saisis "pas-un-email" et un mot de passe puis valide
    Then une bulle d'erreur affiche "Hmm, ce format d'email a l'air bizarre."
    And aucune requête de connexion n'est envoyée

  Scenario: Erreur backend à la connexion
    Given je suis sur l'écran d'authentification en mode connexion
    When je saisis un email valide et un mot de passe puis valide
    And l'API retourne "Invalid credentials"
    Then une bulle d'erreur affiche "Invalid credentials"
