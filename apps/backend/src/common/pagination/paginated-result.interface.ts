// Générique <T> : réutilisable pour n'importe quelle liste paginée (produits, ventes...)
// sans dupliquer cette structure à chaque module.
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
