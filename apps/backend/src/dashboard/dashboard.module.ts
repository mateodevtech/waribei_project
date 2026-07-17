import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [ProductsModule, SalesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
