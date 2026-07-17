import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalesService } from '../sales/sales.service';
import { DashboardService } from './dashboard.service';

const DEFAULT_REVENUE_WINDOW_DAYS = 14;
const MAX_REVENUE_WINDOW_DAYS = 90; // borne haute pour éviter qu'un client demande une fenêtre absurde

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly salesService: SalesService,
  ) {}

  @Get()
  getDashboard() {
    return this.dashboardService.getDashboard();
  }

  // Séparé de getDashboard() volontairement : les agrégats (cartes) sont mis en cache,
  // la tendance du graphique n'a pas besoin du même TTL ni de la même forme de donnée —
  // les coupler aurait forcé à invalider/recalculer l'un dès que l'autre change.
  @Get('revenue-by-day')
  getRevenueByDay(@Query('days') days?: string) {
    const parsed = days ? parseInt(days, 10) : DEFAULT_REVENUE_WINDOW_DAYS;
    const safeDays =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(parsed, MAX_REVENUE_WINDOW_DAYS)
        : DEFAULT_REVENUE_WINDOW_DAYS;
    return this.salesService.getRevenueByDay(safeDays);
  }
}
