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
