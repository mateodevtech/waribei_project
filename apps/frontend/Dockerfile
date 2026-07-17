# syntax=docker/dockerfile:1

# ---------- Étape de build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# IMPORTANT : Vite embarque les variables VITE_* dans le bundle JS AU MOMENT DU BUILD
# (contrairement au backend, il n'existe pas de "config runtime" pour du HTML/JS statique).
# Par défaut on suppose que le backend est atteint sur localhost:3000 CÔTÉ NAVIGATEUR de
# l'utilisateur (le réseau interne Docker "backend:3000" n'existe pas pour son navigateur) —
# si tu changes le port publié du backend dans docker-compose.yml, reconstruis cette image
# avec `--build-arg VITE_API_URL=http://localhost:<nouveau-port>`.
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---------- Étape finale : Nginx sert les fichiers statiques ----------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
