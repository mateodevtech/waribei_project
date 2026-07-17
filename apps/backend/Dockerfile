# syntax=docker/dockerfile:1

# ---------- Étape de build ----------
# Une seule étape avec les outils de compilation, réutilisée pour build ET dépendances :
# bcrypt (dépendance native, PAS bcryptjs) doit être compilé en C/C++ à l'installation.
# python3/make/g++ ne servent qu'ICI — ils ne seront jamais copiés dans l'image finale.
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Retire les devDependencies du node_modules déjà installé, SANS recompiler bcrypt
# (son binaire natif reste intact) -> image finale plus légère, sans perte de fonctionnalité.
RUN npm prune --omit=dev

# ---------- Étape finale : image d'exécution minimale ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

EXPOSE 3000

# dist/main.js = point d'entrée compilé (nest build via tsc, cf. nest-cli.json)
CMD ["node", "dist/main"]
