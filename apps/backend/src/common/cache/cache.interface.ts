// Token d'injection Nest : nécessaire car une interface TS n'existe plus à l'exécution
// (elle est effacée à la compilation) -> on ne peut PAS faire @Inject(ICacheService).
// Ce token symbolique sert de "nom" pour identifier l'implémentation à injecter.
export const CACHE_SERVICE = Symbol('CACHE_SERVICE');

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}
