import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesController } from './categories.controller';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';
import { Category, CategorySchema } from './schemas/category.schema';

@Module({
  imports: [
    // Enregistre le schéma Category auprès de Mongoose UNIQUEMENT pour ce module
    // (chaque module ne "voit" que les modèles dont il a explicitement besoin -> encapsulation)
    MongooseModule.forFeature([{ name: Category.name, schema: CategorySchema }]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoriesRepository],
  // exports : permet à ProductsModule d'importer CategoriesModule pour vérifier
  // qu'une catégorie existe avant de créer un produit (on en aura besoin bientôt).
  exports: [CategoriesService],
})
export class CategoriesModule {}
