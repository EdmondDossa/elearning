# Plateforme e-learning

Application de formations avec catalogue, inscription, lecteur vidéo multilingue,
sous-titres, suivi de progression et administration des formations et modules.
Le frontend utilise Next.js ; l’API utilise NestJS, Prisma et PostgreSQL.

## Démarrage avec Docker

Depuis la racine du projet, avec Docker Compose installé :

1. Copier `.env.example` vers `.env` si ce fichier n’existe pas encore.
2. Renseigner les variables, notamment `POSTGRES_PASSWORD` et `JWT_SECRET`
   (générable avec `openssl rand -base64 48`).
3. Lancer `docker compose up -d --build`.
4. Ouvrir <http://localhost:3000>.

Le backend applique les migrations au démarrage. Avec `SEED_IF_EMPTY=true`,
le seed est ignoré si au moins une formation existe. Sinon, il réinitialise les
données avant de créer la démonstration. Ne pas lancer manuellement le seed sur
une base à conserver : sans cette condition, il efface les données existantes.

Comptes de démonstration créés par le seed, pour un usage local :

| Rôle | Adresse | Mot de passe |
| --- | --- | --- |
| Apprenant | `demo@elearning.local` | `Demo1234!` |
| Administrateur | `admin@elearning.local` | `Demo1234!` |

## Ajouter une formation

Une formation contient des modules. Chaque module possède une vidéo, au moins
une piste audio séparée et, facultativement, des sous-titres par langue.
L’administration est accessible à un compte `ADMIN` via `/admin`.

L’administration sélectionne les médias préchargés dans `backend/media`.
L’import de fichiers depuis le navigateur est hors périmètre de cet exercice :
il ne fait pas partie des fonctionnalités demandées.

Voir le [guide d’administration et des médias](docs/03-administration.md)
pour la procédure complète et les contraintes Docker.

## Documentation

- [Analyse du besoin](docs/01-analyse.md)
- [Conception et API](docs/02-conception.md)
- [Administration et médias](docs/03-administration.md)

## Vérification de la compilation

```bash
docker compose build frontend
docker compose build backend
```

Les formulaires d’administration se trouvent dans `frontend/src/components/admin`.
Les types partagés des espaces apprenant et administrateur sont définis dans
`frontend/src/lib/types.ts`.

## Sessions et Swagger

Chaque connexion crée une session persistante en PostgreSQL. Le JWT contient son
identifiant `sid` ; le backend vérifie que la session existe et n’a pas expiré.
La déconnexion révoque cette session avant d’effacer le cookie. Un JWT copié est
alors refusé, sans déconnecter les autres sessions de l’utilisateur.

La migration `20261007120000_auth_sessions` est appliquée au prochain démarrage
Docker du backend. Les anciens JWT sans `sid` nécessitent une nouvelle connexion.

- Swagger UI : <http://localhost:3000/api/docs/>
- OpenAPI JSON : <http://localhost:3000/api/docs-json>
- Accès direct au backend : <http://localhost:3001/api/docs/>

Dans Swagger, exécuter **POST /api/auth/login**, puis les routes protégées :
le navigateur transmet le cookie httpOnly. Ne pas coller le JWT dans Authorize.
Les routes d’administration nécessitent un compte ADMIN. Les requêtes « Try it
out » agissent réellement sur les données. `SWAGGER_ENABLED=false` désactive la
documentation et son JSON après redémarrage du backend.

Voir [Sessions, Swagger et tests](docs/04-sessions-swagger-tests.md).

## Catalogue personnalisé

Pour un utilisateur connecté, les formations suivies affichent un badge
**À commencer**, **En cours** ou **Terminée**, ainsi que le nombre de modules
terminés et le pourcentage. Une lecture partielle suffit pour passer à « En cours »,
même si aucun module n’est encore terminé. Les formations non suivies et le
catalogue anonyme n’affichent pas de progression personnelle.
