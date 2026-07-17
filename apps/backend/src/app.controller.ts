import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

// @ApiExcludeController : on n'affiche pas ce endpoint technique dans la doc Swagger
// destinée aux utilisateurs de l'API (Categories, Products, Sales...).
@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // @Public() : indispensable. Un service de monitoring/health-check (Render, uptime robot...)
  // ne s'authentifie jamais -> cette route doit rester accessible sans token, par nature.
  @Public()
  @Get()
  getHealth(): { status: string } {
    return this.appService.getHealth();
  }
}
