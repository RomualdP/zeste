Feature: Compose — création conversationnelle d'un épisode

  Scenario: Créer un épisode complet d'un coup
    Given je suis sur "Compose" sans projet en cours
    When je tape "L'IA en 2026" puis valide
    Then une bulle utilisateur affiche "L'IA en 2026"
    And la progression passe à l'étape 2/4

    When j'ajoute la source URL "https://lemonde.fr/ia"
    Then une bulle source apparaît avec le chip "URL"
    And le bouton "Continuer" devient actif

    When je passe à l'étape suivante
    And je sélectionne le ton "Pédagogue"
    Then je suis sur l'étape durée
    And la carte "Pédagogue" est en scale(0.97)

    When je règle la durée à 15 min et choisis 3 chapitres
    And je valide "Lancer la génération"
    Then je suis redirigé vers "Generating"

  Scenario: Erreur API à la création du projet
    Given je suis sur "Compose" sans projet en cours
    When je tape "Mon épisode" et que l'API renvoie une erreur "Quota dépassé"
    Then je reste à l'étape "name"
    And une bulle d'erreur affiche "Quota dépassé"

  Scenario: Reprise sur un projet existant
    Given un projet "p-1" en draft avec des sources mais sans configuration
    When j'ouvre "Compose" avec projectId "p-1"
    Then je reprends à l'étape la plus avancée
