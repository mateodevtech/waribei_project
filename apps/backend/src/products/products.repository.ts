import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import { LOW_STOCK_THRESHOLD } from './enums/stock-status.enum';
import { Product, ProductDocument } from './schemas/product.schema';

export interface ProductAggregates {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockValue: number;
}

export interface ProductSearchParams {
  search?: string;
  category?: string;
  skip: number;
  limit: number;
}

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  create(data: Partial<Product>): Promise<ProductDocument> {
    return this.productModel.create(data);
  }

  findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).populate('category').exec();
  }

  /**
   * Recherche + filtre + pagination en UNE SEULE requête (deux, en réalité :
   * une pour les données de la page, une pour le total -> nécessaire pour
   * calculer totalPages côté client, mais les deux restent des requêtes DB
   * légères avec le même filtre, pas un chargement de la collection entière).
   */
  async searchPaginated(
    params: ProductSearchParams,
  ): Promise<{ data: ProductDocument[]; total: number }> {
    const filter: QueryFilter<ProductDocument> = {};

    if (params.search) {
      // $regex + option 'i' : recherche insensible à la casse, "riz" matche "Riz parfumé".
      // Pas de full-text search index ici (surdimensionné pour un catalogue de test technique) ;
      // un simple $regex suffit largement à ce volume de données.
      filter.name = { $regex: params.search, $options: 'i' };
    }

    if (params.category) {
      filter.category = params.category;
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('category')
        .skip(params.skip)
        .limit(params.limit)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return { data, total };
  }

  update(id: string, data: Partial<Product>): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('category')
      .exec();
  }

  delete(id: string): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  /**
   * Déduction ATOMIQUE du stock lors d'une vente.
   *
   * Pourquoi pas un simple "findById() puis save()" en deux temps ?
   * Parce qu'entre la lecture et l'écriture, une AUTRE vente concurrente pourrait
   * s'intercaler et lire le même stock avant qu'il soit mis à jour -> les deux ventes
   * passeraient alors qu'ensemble elles dépassent le stock réel (race condition classique).
   *
   * La solution : une SEULE requête qui lit ET écrit en même temps, avec la condition
   * de stock suffisant DANS le filtre Mongo lui-même. MongoDB garantit qu'une opération
   * findOneAndUpdate est atomique au niveau du document.
   */
  decrementStock(productId: string, quantityToDeduct: number): Promise<ProductDocument | null> {
    return this.productModel
      .findOneAndUpdate(
        {
          _id: productId,
          quantity: { $gte: quantityToDeduct }, // condition : stock suffisant AU MOMENT de l'écriture
        },
        {
          $inc: { quantity: -quantityToDeduct }, // décrémente de façon atomique côté MongoDB
        },
        { new: true },
      )
      .exec();
    // Si le stock est insuffisant, le filtre ne matche aucun document -> renvoie null.
    // C'est ce "null" que le SalesService interprétera comme "vente refusée".
  }

  /**
   * Calcule en UNE SEULE requête MongoDB (pas de boucle JS côté serveur Node) :
   * - le nombre total de produits
   * - le nombre en stock faible / en rupture
   * - la valeur totale du stock (somme de prix unitaire × quantité)
   *
   * Important : les seuils (0, LOW_STOCK_THRESHOLD) sont réécrits ICI en syntaxe
   * d'agrégation Mongo ($cond), car computeStockStatus() est une fonction JS qui
   * tourne côté Node -> elle ne peut PAS être appelée à l'intérieur d'un pipeline
   * qui s'exécute côté serveur MongoDB. On réutilise seulement la même CONSTANTE
   * numérique (LOW_STOCK_THRESHOLD) pour ne pas désynchroniser les deux logiques.
   */
  async getAggregates(): Promise<ProductAggregates> {
    const [result] = await this.productModel.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$quantity', 0] }, { $lte: ['$quantity', LOW_STOCK_THRESHOLD] }] },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] },
          },
          stockValue: {
            $sum: { $multiply: ['$unitPrice', '$quantity'] },
          },
        },
      },
    ]);

    return (
      result ?? { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, stockValue: 0 }
    );
  }
}
