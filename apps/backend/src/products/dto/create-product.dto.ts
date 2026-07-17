import { IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Le nom est obligatoire' })
  @IsString()
  name: string;

  // IsMongoId : vérifie que la valeur a le FORMAT d'un ObjectId Mongo (24 caractères hexadécimaux).
  // Attention, ça ne vérifie PAS que la catégorie existe réellement en base — juste que le format
  // est plausible. La vérification d'existence réelle est une règle métier -> elle ira dans le Service.
  @IsNotEmpty({ message: 'La catégorie est obligatoire' })
  @IsMongoId({ message: 'La catégorie doit être un identifiant valide' })
  category: string;

  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  @Min(0.01, { message: 'Le prix doit être supérieur à 0' })
  unitPrice: number;

  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(0, { message: 'La quantité ne peut pas être négative' })
  quantity: number;
}
