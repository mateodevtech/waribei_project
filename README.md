# Mini WariStock

Test technique Full Stack — Waribei. Application de gestion de produits, stock et ventes pour un commerçant.

## Structure du dépôt

```
mini-waristock/
├── apps/
│   ├── backend/     # API NestJS + MongoDB — voir apps/backend/README.md
│   └── frontend/     # React + TypeScript + Tailwind — voir apps/frontend/README.md
├── JOURNAL-ERREURS.md  # journal détaillé des erreurs rencontrées pendant le développement
└── README.md          # ce fichier
```

Un seul dépôt (monorepo) pour les deux applications — voir la justification détaillée plus bas.

## Démarrage rapide

**1. Backend**
```bash
cd apps/backend
npm install
cp .env.example .env   # renseigner MONGODB_URI (local ou MongoDB Atlas) et JWT_SECRET
npm run seed            # données initiales : 2 catégories, 5 produits, 3 ventes
npm run start:dev
```
API disponible sur `http://localhost:3000`, documentation Swagger sur `http://localhost:3000/api-docs`.

**2. Frontend**
```bash
cd apps/frontend
npm install
cp .env.example .env   # VITE_API_URL doit pointer vers le backend
npm run dev
```
Application disponible sur `http://localhost:5173`.

**3. Utilisation**
Créer un compte via l'écran d'inscription, puis se connecter — toutes les fonctionnalités (produits, ventes, dashboard) nécessitent d'être authentifié.

## Démarrage avec Docker (alternative recommandée)

Toute la stack (MongoDB + backend + frontend) tourne avec une seule commande, sans installer Node ni MongoDB en local.

```bash
cp .env.example .env   # ajuste JWT_SECRET si besoin (valeur par défaut fonctionnelle pour un test local)
docker compose up --build
```

- Frontend : `http://localhost:5173`
- Backend / Swagger : `http://localhost:3000` / `http://localhost:3000/api-docs`
- MongoDB : exposé sur `localhost:27017` (utile pour se connecter avec Compass/mongosh depuis l'hôte)

**Insérer les données initiales** (une seule fois, dans un autre terminal pendant que la stack tourne) :
```bash
docker compose run --rm seed
```
Le script de seed est idempotent (voir `apps/backend/src/seed/seed.ts`) — le relancer sur une base déjà peuplée ne crée pas de doublons, il s'arrête proprement.

**Arrêter / repartir de zéro** :
```bash
docker compose down          # arrête les conteneurs, garde les données MongoDB (volume)
docker compose down -v       # arrête ET supprime le volume MongoDB (reset complet)
```

**Point d'architecture à connaître** (utile en soutenance) : `VITE_API_URL` est une variable **Vite**, donc embarquée dans le bundle JS **au moment du build de l'image**, pas lue au démarrage du conteneur comme le serait une variable backend classique. Si tu changes le port publié du backend dans `docker-compose.yml`, il faut reconstruire l'image frontend (`docker compose build frontend`) pour que la nouvelle URL soit prise en compte — un simple redémarrage du conteneur ne suffit pas.

## Technologies

| Couche | Stack |
|---|---|
| Backend | NestJS, MongoDB, Mongoose, class-validator, JWT, Swagger |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Axios |

Détails complets, variables d'environnement et choix techniques : voir les README de chaque application.

## Pourquoi un seul dépôt (monorepo) ?

L'énoncé du test demande explicitement *"un lien vers un dépôt Git"* (singulier). Pour un projet de cette taille, porté par une seule personne sur un délai court, le monorepo évite la duplication de configuration (`.gitignore`, documentation) et centralise l'historique — tout en permettant un déploiement indépendant de chaque application (Vercel/Render peuvent cibler `apps/frontend` ou `apps/backend` séparément via leur option "Root Directory").

## Choix architecturaux principaux

- **Statut de stock calculé, jamais stocké** côté backend — élimine tout risque de désynchronisation.
- **Déduction de stock atomique** lors d'une vente — élimine les race conditions entre ventes concurrentes.
- **Snapshot du prix dans chaque vente** — l'historique reste exact même si un prix change après coup.
- **Recherche/filtre côté backend**, combinés avec la pagination dans une seule requête.
- **Cache du dashboard derrière une interface** (`ICacheService`), remplaçable par Redis sans toucher au code métier.
- **Authentification simple, sans gestion de rôles** — le domaine ne définit qu'un seul type d'utilisateur (choix YAGNI assumé).

## Difficultés rencontrées et améliorations envisagées

Voir le détail complet dans `JOURNAL-ERREURS.md`, ainsi que les sections dédiées dans chaque README d'application. En résumé :
- Plusieurs incompatibilités de types liées aux versions récentes des librairies (`mongoose`, `@nestjs/jwt`) — résolues en vérifiant directement les définitions dans `node_modules` plutôt que de se fier à des exemples potentiellement obsolètes.
- Amélioration envisagée principale : transactions MongoDB complètes pour la création de vente (actuellement, seule la déduction de stock est atomique, pas l'ensemble de l'opération stock+historique).

## Bonus implémentés

Authentification JWT, pagination (produits ET historique des ventes), graphiques (Chart.js sur le dashboard), Swagger, interface responsive (vue tableau desktop / cartes mobile), mode sombre, confirmations visuelles après chaque opération réussie, Dockerisation complète (MongoDB + backend + frontend via `docker-compose.yml`, images multi-stage). Non traités faute de temps : tests automatisés, déploiement effectif sur un hébergeur.

## Dockerisation — détails techniques

- **Backend** (`apps/backend/Dockerfile`) : build multi-stage. `bcrypt` est un module natif (compilé en C/C++, pas du JS pur) — l'étape de build installe `python3 make g++` pour le compiler, puis `npm prune --omit=dev` retire les devDependencies **sans recompiler** bcrypt. L'image finale ne contient ni compilateur ni code source, seulement `dist/` et les dépendances de production.
- **Frontend** (`apps/frontend/Dockerfile`) : build Vite dans une image Node, puis les fichiers statiques générés sont servis par Nginx (image finale ~quelques Mo, aucun Node.js dedans). `nginx.conf` inclut un fallback SPA (`try_files ... /index.html`) indispensable pour `createBrowserRouter` — sans lui, un rafraîchissement sur `/products` renverrait un 404 Nginx.
- **MongoDB** : image officielle `mongo:7`, données persistées dans un volume nommé (`mongo-data`) qui survit à `docker compose down` (mais pas à `docker compose down -v`).
- **Service `seed`** : n'est jamais lancé par `docker compose up` (grâce à `profiles: ["tools"]`) — il faut l'invoquer explicitement, pour ne jamais réinsérer des données de test par accident en production.
