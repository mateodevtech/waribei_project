import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// HydratedDocument<Category> = le type d'un document Category une fois sorti de Mongo
// (il ajoute _id, les méthodes Mongoose, etc. par-dessus nos champs déclarés ci-dessous)
export type CategoryDocument = HydratedDocument<Category>;

// { timestamps: true } => Mongoose ajoute et gère automatiquement createdAt / updatedAt
@Schema({ timestamps: true })
export class Category {
  // required: true -> le champ est obligatoire, Mongoose rejette l'insertion sinon
  // unique: true   -> crée un index unique en base, empêche deux catégories du même nom
  @Prop({ required: true, unique: true, trim: true })
  name: string;
}

// SchemaFactory transforme notre classe (avec ses décorateurs @Prop) en un vrai schéma Mongoose exploitable
export const CategorySchema = SchemaFactory.createForClass(Category);
