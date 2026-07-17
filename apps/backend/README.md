# Mini WariStock — Backend

API REST pour la gestion de produits, stock et ventes d'un commerçant.

## Technologies

- **NestJS** (Node.js / TypeScript)
- **MongoDB** + **Mongoose** (ODM)
- **class-validator** / **class-transformer** — validation des DTOs
- **JWT** (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`) — authentification
- **bcrypt** — hashing des mots de passe
- **Swagger** (`@nestjs/swagger`) — documentation interactive de l'API

## Installation

```bash
cd apps/backend
npm install
cp .env.example .env
# éditer .env : renseigner MONGODB_URI (local ou MongoDB Atlas) et JWT_SECRET
```

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `PORT` | Port d'écoute du serveur | `3000` |
| `MONGODB_URI` | Chaîne de connexion MongoDB | `mongodb://localhost:27017/waristock` |
| `JWT_SECRET` | Secret de signature des tokens JWT | une chaîne aléatoire longue et privée |
| `JWT_EXPIRES_IN_SECONDS` | Durée de validité du token, en secondes | `86400` (24h) |

## Initialisation des données

Aucune migration formelle n'est nécessaire : Mongoose crée les collections et index automatiquement au premier usage (pas de schéma de table figé comme en SQL).

Pour peupler la base avec les données de départ (2 catégories, 5 produits, 3 ventes) :

```bash
npm run seed
```

Le script s'arrête sans dupliquer les données si des catégories existent déjà.

## Lancement

```bash
npm run start:dev   # mode développement, rechargement à chaud
npm run build        # compilation TypeScript -> dist/
npm run start:prod   # exécution du build compilé
```

## Documentation API (Swagger)

Une fois le serveur démarré : **http://localhost:3000/api-docs**

Toutes les routes (sauf `/auth/register` et `/auth/login`) nécessitent un token JWT. Dans Swagger UI, cliquer sur "Authorize" et coller le `accessToken` reçu depuis `/auth/login`.

## Architecture

```
src/
├── auth/          # JWT : register, login, guard global, stratégie Passport
├── users/         # le commerçant (un seul type d'utilisateur dans le domaine)
├── categories/    # CRUD catégories
├── products/      # CRUD produits, statut de stock calculé, recherche/filtre/pagination
├── sales/         # enregistrement de ventes, historique, snapshot du prix
├── dashboard/      # agrégations MongoDB + cache
└── common/
    ├── cache/      # interface ICacheService + implémentation in-memory (Redis-ready)
    ├── filters/    # filtre d'exceptions global (format d'erreur unifié)
    └── pagination/ # type générique PaginatedResult<T>
```

Chaque module métier suit la même stratification : **Controller** (HTTP) → **Service** (règles métier) → **Repository** (Mongoose) → **Schema** (persistance).

## Choix techniques principaux

- **Statut de stock calculé, jamais stocké** (`virtual` Mongoose) : élimine tout risque de désynchronisation entre la quantité réelle et l'état affiché.
- **Déduction de stock atomique** (`findOneAndUpdate` avec condition `$gte`) : élimine les race conditions entre ventes concurrentes, sans verrou applicatif.
- **Snapshot du prix dans chaque vente** : l'historique des ventes reste exact même si le prix d'un produit change ensuite.
- **CA par jour agrégé côté MongoDB** (`GET /dashboard/revenue-by-day?days=14`) plutôt que côté client : reste exact quel que soit le volume total de ventes (le client ne reçoit que des points déjà agrégés, pas un échantillon de ventes brutes à regrouper lui-même).
- **Recherche/filtre côté backend** plutôt que frontend : nécessaire pour cohabiter avec la pagination sans annuler son bénéfice (charger une page à la fois, pas tout le catalogue).
- **Cache du dashboard derrière une interface (`ICacheService`)** : implémentation in-memory aujourd'hui (gratuite, suffisante pour une seule instance), remplaçable par Redis en ne touchant qu'un seul fichier (`cache.module.ts`), sans toucher au code métier.
- **Pas de gestion de rôles** : le domaine ne définit qu'un seul type d'utilisateur (le commerçant) ; un système de rôles aurait été du code sans bénéfice fonctionnel réel (principe YAGNI).

## Difficultés rencontrées

- Incompatibilités de types avec les versions installées de `mongoose` et `@nestjs/jwt` (renommage de `FilterQuery` en `QueryFilter`, typage strict de `expiresIn`) — résolues en consultant directement les définitions de types dans `node_modules` plutôt que de se fier à des exemples de documentation potentiellement obsolètes.
- Articulation entre le typage "frontière HTTP" (DTOs, tout en `string`) et "frontière base de données" (Mongoose, `ObjectId` typés) — conversions explicites systématiques plutôt que des `as any`.

## Améliorations envisagées

- Transactions MongoDB complètes (session Mongoose) pour la création de vente, afin de garantir l'atomicité entre la déduction de stock et l'enregistrement de la vente (la déduction de stock elle-même reste atomique indépendamment).
- Cache Redis partagé si déploiement multi-instances.
- Tests unitaires (Services mockant les Repositories) et tests e2e.
