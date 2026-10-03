# 1. Analyse du besoin

## Contexte

Mini plateforme e-learning permettant à un apprenant de suivre des formations
vidéo/audio, avec doublage multilingue et suivi de progression.

## Acteurs

- **Visiteur** : non connecté, peut s'inscrire ou se connecter.
- **Apprenant** : connecté, consulte le catalogue, suit des formations.
- **Administrateur** (bonus) : gère les formations et modules.

## Exigences fonctionnelles (user stories)

| ID   | En tant que… | Je veux…                                             | Afin de…                     |
| ---- | ------------ | ---------------------------------------------------- | ---------------------------- |
| US1  | visiteur     | créer un compte                                      | accéder aux formations       |
| US2  | visiteur     | me connecter / me déconnecter                        | sécuriser mon accès          |
| US3  | apprenant    | voir le catalogue des formations                     | choisir quoi suivre          |
| US4  | apprenant    | rechercher par titre ou formateur                    | trouver rapidement           |
| US5  | apprenant    | filtrer par langue ou niveau                         | adapter à mon profil         |
| US6  | apprenant    | voir le détail et les modules d'une formation        | savoir ce qu'elle contient   |
| US7  | apprenant    | lire un module (vidéo/audio)                         | apprendre                    |
| US8  | apprenant    | choisir la langue de la piste audio                  | suivre dans ma langue        |
| US9  | apprenant    | marquer un module comme terminé et passer au suivant | avancer                      |
| US10 | apprenant    | reprendre là où je me suis arrêté                    | ne pas perdre ma progression |
| US11 | apprenant    | voir mes formations et leur progression              | suivre mon avancement        |

## Exigences non fonctionnelles

- Lancement complet via `docker compose up`.
- Pages protégées inaccessibles sans authentification.
- Mots de passe jamais stockés en clair.
- Interface claire, navigation fluide, responsive (bonus).
- Code testé et documenté, historique Git lisible.
- Application déployée et accessible en ligne.

## Hypothèses et hors périmètre

- Le doublage est **simulé** : pistes audio pré-enregistrées ou générées,
  pas de doublage réel.
- Les vidéos sont des fichiers de démonstration servis par le backend.
- Pas de paiement, pas de certification.

## Priorisation (MoSCoW)

- **Must** : US1 à US11, Docker, doc, tests de base, déploiement.
- **Should** : sous-titres, responsive.
- **Could** : favoris, quiz, interface admin.
