import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';

@Injectable()
export class SalesRepository {
  constructor(@InjectModel(Sale.name) private saleModel: Model<SaleDocument>) {}

  create(data: Partial<Sale>): Promise<SaleDocument> {
    return this.saleModel.create(data);
  }

  findAllPaginated(skip: number, limit: number): Promise<{ data: SaleDocument[]; total: number }> {
    return Promise.all([
      this.saleModel
        .find()
        .populate('product') // pour afficher le nom du produit dans l'historique, pas juste son ID
        .sort({ date: -1 }) // "les ventes les plus récentes en premier" -> tri explicite ici
        .skip(skip)
        .limit(limit)
        .exec(),
      this.saleModel.countDocuments(),
    ]).then(([data, total]) => ({ data, total }));
  }

  // Utile pour le Dashboard : calculer le chiffre d'affaires total sans charger
  // toutes les ventes en mémoire côté Node -> on laisse MongoDB faire la somme.
  async sumTotalRevenue(): Promise<number> {
    const result = await this.saleModel.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  /**
   * CA regroupé par jour, calculé CÔTÉ MONGODB (pas en récupérant N ventes puis en
   * les regroupant côté Node). Différence importante avec un "fetch les 100 dernières
   * ventes puis groupe en JS" : ce calcul reste exact et rapide même avec un historique
   * de ventes qui grossit indéfiniment (des milliers de ventes), puisque MongoDB
   * n'a besoin de lire que les documents du fenêtre de temps demandée (grâce à l'index
   * sur `date`), pas l'intégralité de la collection.
   */
  async getRevenueByDay(days: number): Promise<{ date: string; total: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const results = await this.saleModel.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $group: {
          // Regroupe par jour calendaire (format "YYYY-MM-DD"), pas par timestamp exact —
          // deux ventes le même jour à des heures différentes tombent dans le même groupe.
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } }, // ordre chronologique croissant, attendu par un graphique en barres
    ]);

    return results.map((r) => ({ date: r._id as string, total: r.total as number }));
  }
}
