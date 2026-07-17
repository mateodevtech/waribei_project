// Toute clé de cache utilisée dans l'application est déclarée ICI, une seule fois.
// Évite qu'une faute de frappe entre deux fichiers ("dashbord" vs "dashboard")
// casse silencieusement l'invalidation du cache.
export const CACHE_KEYS = {
  DASHBOARD: 'dashboard',
} as const;
