#!/bin/sh
set -e

echo "→ Application des migrations"
prisma migrate deploy

echo "→ Seed (si base vide)"
prisma db seed

echo "→ Démarrage de l'API"
exec "$@"