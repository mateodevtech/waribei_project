import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SaleDocument = HydratedDocument<Sale>;

@Schema({ timestamps: false }) // on gère notre propre champ "date", pas besoin de createdAt/updatedAt ici
export class Sale {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantitySold: number;

  // SNAPSHOT du prix au moment de la vente — copié depuis Product.unitPrice à l'instant T.
  // Volontairement dupliqué (dénormalisé) : si le prix du produit change après-coup,
  // l'historique des ventes passées ne doit JAMAIS être réécrit rétroactivement.
  // C'est un choix de modélisation assumé, pas un oubli de "référencer" le produit pour le prix.
  @Prop({ required: true, min: 0 })
  unitPrice: number;

  // Également dupliqué plutôt que recalculé à la volée : une vente est un fait historique figé,
  // pas une valeur dérivée qui doit rester "live" comme le statut de stock d'un produit.
  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, default: Date.now })
  date: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

// Index sur "date" en ordre décroissant : l'énoncé demande "les ventes les plus
// récentes en premier" -> ce tri sera fréquent, un index accélère cette requête
// quand l'historique grossit (a peu d'effet sur 3-5 ventes de test, mais c'est
// la bonne pratique à connaître et à savoir justifier).
SaleSchema.index({ date: -1 });
