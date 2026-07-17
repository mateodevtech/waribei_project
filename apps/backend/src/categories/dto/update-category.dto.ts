import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

// PartialType() : reprend TOUS les champs + validations de CreateCategoryDto,
// mais les rend optionnels. Évite de dupliquer les règles de validation
// pour un simple "update partiel" (PATCH).
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
