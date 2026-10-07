# Sessions, Swagger et tests

## Pourquoi stocker les sessions ?

Un JWT signé reste cryptographiquement valide jusqu’à son expiration. Supprimer
le cookie du navigateur ne suffit pas à invalider une copie de ce token.

Chaque inscription et connexion crée désormais une ligne `AuthSession` en
PostgreSQL et un JWT avec un `sid` aléatoire. Le guard vérifie la signature,
l’expiration du JWT, l’existence de la session, son utilisateur et son expiration.
Le rôle est relu depuis l’utilisateur pour appliquer les changements de droits.

`POST /api/auth/logout` supprime uniquement la session courante avant d’effacer
le cookie. Réutiliser son JWT renvoie alors 401 sur les routes protégées. Le
logout reste utilisable sans cookie, avec un token expiré ou déjà révoqué.
Sur les routes publiques, ces tokens sont traités comme anonymes. Une erreur de
base de données est propagée : elle ne doit pas être présentée comme une révocation réussie.

La durée reste de 24 heures. Les sessions expirées de l’utilisateur sont nettoyées
à sa prochaine connexion ; celles des utilisateurs inactifs restent en base mais
ne permettent aucun accès. Une purge périodique pourrait être ajoutée si le volume
le justifie. Le JWT brut n’est pas enregistré dans la base.

Ce choix ajoute une lecture en base par requête authentifiée, en échange d’une
révocation persistante qui fonctionne avec plusieurs instances du backend.
Les requêtes déjà autorisées avant une déconnexion ne sont pas interrompues.

## Migration

La migration `20261007120000_auth_sessions` ajoute une table et son index sans
effacer les données existantes. Le démarrage Docker applique les migrations.

```bash
docker compose up -d --build backend
```

Les JWT émis avant cette évolution n’ont pas de `sid` et sont refusés. Il faut
se reconnecter. Le frontend sait déjà nettoyer un cookie refusé par l’API.

## Swagger

- Interface : `http://localhost:3000/api/docs/`
- Spécification : `http://localhost:3000/api/docs-json`
- Backend direct : `http://localhost:3001/api/docs/`

Les DTO sont décrits avec leurs champs, exemples et principales contraintes.
Les routes sont regroupées par domaine et les routes protégées déclarent
l’authentification par cookie. Les DTO PATCH utilisent le `PartialType` Swagger
pour conserver leur schéma tout en rendant les propriétés optionnelles.

Pour tester une session :

1. Ouvrir Swagger, sélectionner `POST /api/auth/login`, puis « Try it out ».
2. Envoyer les identifiants d’un compte local ; le navigateur reçoit le cookie.
3. Appeler `GET /api/auth/me` : résultat 200.
4. Appeler `POST /api/auth/logout` : résultat 204.
5. Rappeler `GET /api/auth/me` : résultat 401.

Le bouton Authorize ne peut pas écrire un cookie httpOnly : utiliser la route
login. Aucun mécanisme Bearer supplémentaire n’est introduit. La documentation
est publique par défaut et se désactive avec `SWAGGER_ENABLED=false`.

Intégration fondée sur la [documentation officielle NestJS Swagger](https://docs.nestjs.com/openapi/introduction)
et sa [configuration de l’authentification par cookie](https://docs.nestjs.com/openapi/security).

## Validation automatisée

Le test E2E de squelette a été remplacé par une suite de 14 tests qui traverse
les routes NestJS, les guards et une vraie base PostgreSQL :

- santé et accès anonyme refusé ;
- création persistante d’une session à l’inscription ;
- sessions distinctes et refus admin pour un utilisateur standard ;
- rejet d’un JWT copié après logout, sans invalider une autre session ;
- logout répété ou avec token invalide ;
- accès public avec token révoqué ;
- refus d’un ancien JWT sans sid et d’une signature altérée ;
- refus d’une session associée à un autre utilisateur ;
- expiration du JWT ;
- expiration de la session en base ;
- disponibilité de Swagger et cohérence des principaux schémas OpenAPI.

Fichier : `backend/test/app.e2e-spec.ts`. Utiliser une **base dédiée aux tests**,
la migrer puis lancer depuis `backend` :

```bash
# E2E_DATABASE_URL doit être défini vers la base dédiée avant ces commandes.
DATABASE_URL="$E2E_DATABASE_URL" npx prisma migrate deploy
npm run test:e2e -- --runInBand
```

La suite refuse de démarrer si `E2E_DATABASE_URL` est absent. Elle crée un compte
à email unique et le supprime après les tests ; ne pas la diriger vers une base
de production. Elle ne lance pas le seed.

Les tests de catalogue couvrent ses statuts personnels, la lecture partielle,
les filtres, les formations sans module et l’isolation entre utilisateurs.
Ils ne couvrent pas encore tout le catalogue, le lecteur multilingue ni
la progression métier. Ils ne constituent pas un audit de sécurité global.

Validation effectuée le 7 octobre 2026 : 11 tests E2E réussis sur PostgreSQL
isolé, lint des fichiers concernés et build Docker backend réussis. Vérification
dans Chromium via le frontend : connexion depuis Swagger, cookie httpOnly,
logout puis réutilisation du JWT rejetée avec 401.

Trois tests supplémentaires couvrent les statuts du catalogue, l’absence de
fuite de progression vers un visiteur ou un autre compte, et la mise à jour
de la progression avec conservation des filtres.
