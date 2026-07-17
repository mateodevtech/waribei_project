import { Type } from 'class-transformer';
import { IsIn, IsInt, IsMongoId, IsOptional, IsString, Max, Min } from 'class-validator';

// Ce DTO valide les QUERY PARAMS de GET /products (?search=&category=&page=&limit=).
// Contrairement à un body JSON, les query params arrivent TOUJOURS en string brut
// depuis HTTP -> @Type(() => Number) est nécessaire pour que class-transformer les
// convertisse en number AVANT que class-validator applique @IsInt()/@Min().
// (Le ValidationPipe global a "transform: true", ce qui active cette conversion.)
export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsMongoId({ message: 'La catégorie doit être un identifiant valide' })
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un entier' })
  @Min(1, { message: 'La page doit être supérieure ou égale à 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1)
  @Max(100, { message: 'La limite ne peut pas dépasser 100' }) // évite qu'un client demande 1 million de lignes
  limit: number = 10;
}
