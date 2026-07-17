import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from '../products/products.module';
import { SalesController } from './sales.controller';
import { SalesRepository } from './sales.repository';
import { SalesService } from './sales.service';
import { Sale, SaleSchema } from './schemas/sale.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
    ProductsModule, // pour injecter ProductsService (findOne + decrementStock)
  ],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService], // DashboardModule en aura besoin (chiffre d'affaires)
})
export class SalesModule {}
