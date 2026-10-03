# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dépendances
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build (les rewrites vers le backend sont figés ici)
FROM deps AS build
ARG BACKEND_URL=http://backend:3001
ENV BACKEND_URL=$BACKEND_URL
COPY . .
RUN npm run build

# Image finale : serveur standalone uniquement
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]