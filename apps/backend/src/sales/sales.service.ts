import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { CACHE_SERVICE, type ICacheService } from '../common/cache/cache.interface';
import { CACHE_KEYS } from '../common/cache/cache-keys';
import { PaginatedResult } from '../common/pagination/paginated-result.interface';
import { ProductsService } from '../products/products.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { SalesRepository } from './sales.repository';
import { SaleDocument } from './schemas/sale.schema';

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly productsService: ProductsService, // jamais ProductsRepository directement
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateSaleDto): Promise<SaleDocument> {
    // Étape 1 — le produit existe-t-il ? findOne() lève une NotFoundException (404) sinon.
    // On lit le produit ICI pour récupérer son prix ACTUEL, qu'on va figer (snapshot) dans la vente.
    const product = await this.productsService.findOne(dto.product);

    // Étape 2 — tentative de déduction ATOMIQUE du stock.
    // On ne vérifie pas "if (product.quantity >= dto.quantitySold)" ici en mémoire :
    // entre cette lecture et l'écriture, le stock pourrait avoir changé (autre vente concurrente).
    // decrementStock() encode la condition de suffisance DANS la requête Mongo elle-même (atomique).
    const updatedProduct = await this.productsService.decrementStock(
      dto.product,
      dto.quantitySold,
    );

    // Étape 3 — si la déduction a échoué, c'est que la condition "quantity >= quantitySold"
    // n'était pas remplie AU MOMENT de l'écriture -> stock insuffisant. Vente refusée.
    if (!updatedProduct) {
      // On relit l'état ACTUEL du produit plutôt que de réutiliser `product.quantity`
      // (lu à l'étape 1) : entre les deux lectures, une autre vente concurrente a pu
      // modifier le stock -> réutiliser l'ancienne valeur donnerait un message inexact,
      // ce qui serait pire qu'inutile pour un message censé être "compréhensible".
      const current = await this.productsService.findOne(dto.product);
      throw new BadRequestException(
        `Stock insuffisant pour "${current.name}" : ${current.quantity} unité(s) disponible(s), ` +
          `mais ${dto.quantitySold} demandée(s). La vente a été refusée, aucune quantité n'a été déduite.`,
      );
    }

    // Étape 4 — snapshot du prix et calcul du montant, à partir du prix lu à l'étape 1
    // (le prix du produit, PAS un prix envoyé par le client - voir le commentaire dans le DTO).
    const unitPrice = product.unitPrice;
    const totalAmount = unitPrice * dto.quantitySold;

    const sale = await this.salesRepository.create({
      product: new Types.ObjectId(dto.product),
      quantitySold: dto.quantitySold,
      unitPrice,
      totalAmount,
      date: new Date(),
    });

    // Une vente impacte DEUX choses dans le dashboard : le stock (quantité déduite)
    // ET le chiffre d'affaires (nouvelle vente). Un seul point d'invalidation ici,
    // plutôt que dans ProductsService.decrementStock(), pour ne pas invalider deux fois
    // pour une seule opération métier (create() orchestre tout : stock + vente).
    await this.cacheService.del(CACHE_KEYS.DASHBOARD);

    return sale;
  }

  findAll(query: SaleQueryDto): Promise<PaginatedResult<SaleDocument>> {
    const skip = (query.page - 1) * query.limit;
    return this.salesRepository.findAllPaginated(skip, query.limit).then(({ data, total }) => ({
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    }));
  }

  getTotalRevenue(): Promise<number> {
    return this.salesRepository.sumTotalRevenue();
  }

  getRevenueByDay(days: number): Promise<{ date: string; total: number }[]> {
    return this.salesRepository.getRevenueByDay(days);
  }
}
