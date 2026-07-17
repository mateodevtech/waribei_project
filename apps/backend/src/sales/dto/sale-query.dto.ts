import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class SaleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un entier' })
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un entier' })
  @Min(1)
  @Max(100)
  limit: number = 10;
}
