import { Injectable } from '@nestjs/common';
import { ICacheService } from './cache.interface';

/**
 * Implémentation "in-memory" : un simple Map en RAM du process Node.
 * Suffisant pour ce test technique (une seule instance de serveur, pas de scaling horizontal).
 *
 * Limite connue et assumée : si on déploie plusieurs instances du backend derrière
 * un load balancer, chaque instance aurait SON PROPRE cache non synchronisé -> il faudrait
 * alors une vraie solution partagée comme Redis. C'est exactement pour ça que cette classe
 * implémente ICacheService plutôt que d'être appelée directement : remplacer cette classe
 * par une RedisCacheService ne demanderait de changer qu'un seul endroit (cache.module.ts),
 * jamais le code métier qui consomme le cache.
 */
@Injectable()
export class InMemoryCacheService implements ICacheService {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key); // entrée expirée -> nettoyage paresseux (lazy)
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}
