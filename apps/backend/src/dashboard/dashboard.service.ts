import { Inject, Injectable } from '@nestjs/common';
import { CACHE_SERVICE, type ICacheService } from '../common/cache/cache.interface';
import { CACHE_KEYS } from '../common/cache/cache-keys';
import { ProductsService } from '../products/products.service';
import { SalesService } from '../sales/sales.service';

export interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockValue: number;
  totalRevenue: number;
}

const DASHBOARD_CACHE_TTL_SECONDS = 60;

@Injectable()
export class DashboardService {
  constructor(
    private readonly productsService: ProductsService,
    private readonly salesService: SalesService,
    // @Inject(CACHE_SERVICE) : obligatoire ici car CACHE_SERVICE est un token (Symbol),
    // pas une classe -> Nest ne peut pas deviner QUOI injecter juste depuis le type ICacheService
    // (qui de toute façon n'existe plus au runtime, effacé par la compilation TS -> JS).
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) {}

  async getDashboard(): Promise<DashboardData> {
    // 1. On tente d'abord le cache -> si présent et valide, ZERO requête à la base de données.
    const cached = await this.cacheService.get<DashboardData>(CACHE_KEYS.DASHBOARD);
    if (cached) {
      return cached;
    }

    // 2. Cache absent ou expiré -> recalcul réel, en parallèle (Promise.all) pour ne pas
    // attendre séquentiellement l'agrégation produits PUIS le chiffre d'affaires.
    const [productAggregates, totalRevenue] = await Promise.all([
      this.productsService.getAggregates(),
      this.salesService.getTotalRevenue(),
    ]);

    const dashboard: DashboardData = {
      totalProducts: productAggregates.totalProducts,
      lowStockCount: productAggregates.lowStockCount,
      outOfStockCount: productAggregates.outOfStockCount,
      stockValue: productAggregates.stockValue,
      totalRevenue,
    };

    // 3. On remet en cache pour les prochaines lectures, jusqu'à invalidation explicite
    // (par une vente ou une modification de produit) ou expiration du TTL en filet de sécurité.
    await this.cacheService.set(CACHE_KEYS.DASHBOARD, dashboard, DASHBOARD_CACHE_TTL_SECONDS);

    return dashboard;
  }
}
