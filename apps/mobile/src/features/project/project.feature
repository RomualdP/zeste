Feature: Gestion de projet

  Scenario: Afficher la liste des projets
    Given l'utilisateur est connecté
    When il arrive sur l'écran "Mes projets"
    Then il voit la liste de ses projets
    And chaque projet affiche son nom et son statut

  Scenario: Afficher un message quand il n'y a pas de projets
    Given l'utilisateur est connecté
    And il n'a aucun projet
    When il arrive sur l'écran "Mes projets"
    Then il voit le message "Aucun projet. Créez-en un !"

  Scenario: Créer un nouveau projet
    Given l'utilisateur est sur l'écran de création
    When il saisit le nom "Mon Podcast IA"
    And il appuie sur "Créer le projet"
    Then le projet est créé via l'API
    And il est redirigé vers le détail du projet

  Scenario: Voir le détail d'un projet
    Given l'utilisateur a un projet "Mon Podcast"
    When il appuie sur le projet dans la liste
    Then il voit le nom, le statut, le ton et la durée cible
    And il voit la liste des sources

  Scenario: Ajouter une source URL
    Given l'utilisateur est sur le détail du projet
    When il appuie sur "Ajouter une source"
    And il saisit l'URL "https://example.com/article"
    And il appuie sur "Ajouter"
    Then la source est ajoutée via l'API
    And il revient sur le détail du projet

  Scenario: Supprimer une source
    Given l'utilisateur a un projet avec une source
    When il appuie sur supprimer la source
    Then la source est supprimée via l'API
    And la liste des sources est mise à jour
