import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Get()
  findAll(@Query() query: SaleQueryDto) {
    return this.salesService.findAll(query);
  }

  // Pas de @Patch ni @Delete ici : une vente enregistrée est un fait historique.
  // La modifier ou la supprimer romprait la traçabilité comptable (chiffre d'affaires,
  // historique) — ce n'est pas un oubli, c'est une décision de modélisation du domaine.
}
