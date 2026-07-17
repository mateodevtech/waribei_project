import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { computeStockStatus } from '../enums/stock-status.enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({
  timestamps: true,
  // toJSON/toObject { virtuals: true } : indispensable pour que le champ "status"
  // calculé ci-dessous apparaisse dans les réponses JSON de l'API (par défaut,
  // Mongoose n'inclut PAS les virtuals dans la sérialisation).
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  // type: Types.ObjectId + ref: 'Category' -> ce champ stocke uniquement l'_id
  // d'un document Category. Ce n'est PAS une jointure SQL : sans .populate() explicite,
  // Mongoose renvoie juste l'ObjectId brut, pas le document Category entier.
  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ required: true, min: 0.01 })
  unitPrice: number;

  @Prop({ required: true, min: 0, default: 0 })
  quantity: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Virtual = un champ qui n'existe PAS en base, recalculé à chaque lecture.
// Ça garantit qu'il ne peut JAMAIS être désynchronisé de la quantité réelle
// (contrairement à un champ "status" qu'on aurait stocké et oublié de mettre à jour).
ProductSchema.virtual('status').get(function (this: ProductDocument) {
  return computeStockStatus(this.quantity);
});
