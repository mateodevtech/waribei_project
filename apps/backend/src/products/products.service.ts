import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CACHE_SERVICE, type ICacheService } from '../common/cache/cache.interface';
import { CACHE_KEYS } from '../common/cache/cache-keys';
import { CategoriesService } from '../categories/categories.service';
import { PaginatedResult } from '../common/pagination/paginated-result.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';
import { ProductDocument } from './schemas/product.schema';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    // On importe le SERVICE de Category (jamais son Repository) : un module ne doit
    // exposer que ses Services aux autres modules, jamais sa couche de persistance.
    // C'est ce que permet le "exports: [CategoriesService]" qu'on a mis dans CategoriesModule.
    private readonly categoriesService: CategoriesService,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) {}

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    // Règle métier : vérifier que la catégorie référencée existe VRAIMENT.
    // findOne() de CategoriesService lève déjà une NotFoundException si absente -> on la laisse remonter.
    await this.categoriesService.findOne(dto.category);
    // Conversion EXPLICITE string -> Types.ObjectId : le DTO parle "HTTP/JSON" (tout est string),
    // le schéma Mongoose parle "MongoDB" (ObjectId typé). On ne mélange jamais les deux
    // représentations implicitement, la conversion doit être visible dans le code.
    const product = await this.productsRepository.create({
      ...dto,
      category: new Types.ObjectId(dto.category),
    });
    // Un nouveau produit change totalProducts et stockValue -> le dashboard mis en cache est obsolète.
    await this.cacheService.del(CACHE_KEYS.DASHBOARD);
    return product;
  }

  async findAll(query: ProductQueryDto): Promise<PaginatedResult<ProductDocument>> {
    // page/limit ont déjà des valeurs par défaut (1 et 10) posées dans le DTO lui-même,
    // donc pas besoin de "?? 1" ici -> une seule source de vérité pour ces défauts.
    const skip = (query.page - 1) * query.limit;

    const { data, total } = await this.productsRepository.searchPaginated({
      search: query.search,
      category: query.category,
      skip,
      limit: query.limit,
    });

    return {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Produit ${id} introuvable`);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    await this.findOne(id);
    const { category, ...rest } = dto;
    const dataToUpdate: Partial<{ category: Types.ObjectId } & typeof rest> = { ...rest };

    if (category) {
      await this.categoriesService.findOne(category);
      dataToUpdate.category = new Types.ObjectId(category);
    }

    const updated = await this.productsRepository.update(id, dataToUpdate);
    // Le prix ou la quantité ont pu changer -> stockValue et les compteurs de statut aussi.
    await this.cacheService.del(CACHE_KEYS.DASHBOARD);
    return updated as ProductDocument;
  }

  async remove(id: string): Promise<ProductDocument> {
    await this.findOne(id);
    const deleted = await this.productsRepository.delete(id);
    await this.cacheService.del(CACHE_KEYS.DASHBOARD);
    return deleted as ProductDocument;
  }

  /**
   * Utilisé par SalesModule au moment d'enregistrer une vente.
   * Renvoie le produit mis à jour, ou null si le stock était insuffisant
   * (c'est SalesService qui décide quoi faire de ce null -> refuser la vente).
   */
  decrementStock(productId: string, quantity: number): Promise<ProductDocument | null> {
    return this.productsRepository.decrementStock(productId, quantity);
  }

  getAggregates() {
    return this.productsRepository.getAggregates();
  }
}
