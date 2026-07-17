import { Global, Module } from '@nestjs/common';
import { CACHE_SERVICE } from './cache.interface';
import { InMemoryCacheService } from './in-memory-cache.service';

@Global() // disponible partout sans réimporter CacheModule dans chaque module métier
@Module({
  providers: [
    {
      provide: CACHE_SERVICE, // le token symbolique défini dans cache.interface.ts
      useClass: InMemoryCacheService, // <-- SEULE ligne à changer pour brancher Redis un jour
    },
  ],
  exports: [CACHE_SERVICE],
})
export class CacheModule {}
