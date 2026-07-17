import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // On stocke UNIQUEMENT le hash, jamais le mot de passe en clair.
  // Pas de champ "role" : rappel de notre décision -> un seul type d'utilisateur
  // dans tout le domaine (le commerçant), donc pas de champ inutile à maintenir.
  @Prop({ required: true })
  passwordHash: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
