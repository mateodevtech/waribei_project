# Mini WariStock — Frontend

Interface web React pour la gestion de produits, stock et ventes.

## Technologies

- **React 19** + **TypeScript**, scaffoldé avec **Vite**
- **Tailwind CSS v4** (plugin Vite natif, pas de `tailwind.config.js` requis)
- **React Router** — routage et protection de routes
- **Axios** — client HTTP avec intercepteurs JWT
- **Chart.js** / **react-chartjs-2** — graphiques du dashboard
- **lucide-react** — icônes
- **Context API** (pas de Redux) — authentification, notifications, thème clair/sombre

## Installation

```bash
cd apps/frontend
npm install
cp .env.example .env
# éditer .env si le backend ne tourne pas sur http://localhost:3000
```

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de base de l'API backend | `http://localhost:3000` |

Le préfixe `VITE_` est obligatoire : Vite n'expose au code frontend que les variables ainsi préfixées (sécurité).

## Lancement

```bash
npm run dev       # serveur de développement (http://localhost:5173)
npm run build     # build de production -> dist/
npm run preview   # prévisualiser le build de production
```

**Important** : le backend doit être démarré (et sa base de données peuplée via `npm run seed`) avant de se connecter depuis le frontend.

## Architecture

```
src/
├── api/          # seule couche qui parle au backend (axios) — aucun composant n'appelle axios directement
├── context/      # AuthContext (session), ToastContext (notifications globales)
├── pages/        # un composant par écran : Login, Register, Dashboard, Products, Sales
├── components/   # composants réutilisables (formulaires modaux, badges, pagination...)
├── hooks/        # useDebounce (recherche), useApiError (messages d'erreur uniformes)
├── types/        # types partagés, reflètent les formes de données du backend
└── router.tsx    # définition des routes + protection via ProtectedRoute
```

## Choix techniques

- **Recherche/filtre/pagination délégués au backend** : le frontend ne fait qu'appeler `GET /products` avec les bons query params — cohérent avec le choix fait côté backend (voir son README). L'historique des ventes (`GET /sales`) est paginé de la même façon.
- **Validation client en miroir de la validation serveur** : retour immédiat à l'utilisateur, mais le backend reste la seule source de vérité (ex : le stock est revérifié côté serveur au moment de la vente, même si le formulaire l'a déjà vérifié côté client).
- **Déconnexion automatique sur 401** : un intercepteur Axios global détecte un token expiré/invalide et redirige vers `/login`, plutôt que de laisser l'utilisateur sur des écrans dont chaque action échouerait silencieusement.
- **Formulaires en modales** plutôt qu'en pages dédiées, y compris la création rapide de catégorie directement depuis le formulaire produit (mini-formulaire inline, pas une deuxième modale empilée).
- **Responsive à deux vues distinctes** (pas juste un scroll horizontal) : les tableaux (Produits, Ventes) affichent une vraie table sur écran large, et une liste de cartes empilées sur mobile — un tableau à 6 colonnes est illisible sur un écran de téléphone.
- **Mode sombre piloté par variables CSS** : les couleurs de l'app sont des `var(--color-*)` ; le mode sombre redéfinit uniquement ces variables sous une classe `.dark` (posée sur `<html>` par `ThemeContext`, persistée en `localStorage`) — aucun composant n'a besoin d'ajouter de classes `dark:` individuellement.
- **Toasts de confirmation avec icône** (succès/erreur) sur chaque opération d'écriture (connexion, inscription, création/modification/suppression de produit, vente) — réponse directe à l'exigence de l'énoncé sur la confirmation après succès.

## Difficultés rencontrées

- Ordre des règles `@import` en CSS : la police Google Fonts doit être déclarée **avant** `@import "tailwindcss"`, sinon le navigateur/le bundler émet un avertissement (les règles `@import` doivent toutes précéder toute autre règle CSS).
- Taille du bundle de production (~536 kB avant compression, ~174 kB gzippé) au-delà du seuil d'avertissement par défaut de Vite, principalement dû à Chart.js — sans impact fonctionnel, mais un découpage en chunks (`import()` dynamique pour la page Dashboard) serait la prochaine optimisation si l'app grossissait.

## Améliorations envisagées

- Génération automatique des types TypeScript depuis le schéma Swagger du backend (évite la synchronisation manuelle actuelle des `types/index.ts`).
- Tests de composants (React Testing Library).
- Découpage du bundle par route (`React.lazy`) pour réduire le poids du chargement initial.
