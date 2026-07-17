import { IsNotEmpty, IsString, MinLength } from 'class-validator';

// Ce DTO décrit "ce qui a le droit d'entrer" via l'API — indépendant du schéma Mongoose.
// Le schéma Mongoose décrit "ce qui est stocké" ; le DTO décrit "ce qui est accepté en entrée".
// Les deux se ressemblent ici car le cas est simple, mais ce ne sont pas la même responsabilité.
export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Le nom de la catégorie est obligatoire' })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  name: string;
}
