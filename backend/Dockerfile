# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
# OpenSSL est requis par le moteur Prisma sur Alpine
RUN apk add --no-cache openssl

# Dépendances complètes (build)
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Compilation
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# Dépendances de production uniquement
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

# Image finale
FROM base AS runtime
ENV NODE_ENV=production \
    PATH=/app/node_modules/.bin:$PATH \
    PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json docker-entrypoint.sh ./
COPY prisma ./prisma
COPY media ./media
USER node
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]