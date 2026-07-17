import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { SalesModule } from './sales/sales.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CacheModule } from './common/cache/cache.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // isGlobal: true -> ConfigService injectable partout sans réimporter ConfigModule dans chaque module
    ConfigModule.forRoot({ isGlobal: true }),

    // forRootAsync : on attend que ConfigService soit prêt avant de lire l'URI Mongo
    // (évite de dépendre d'une variable process.env lue "en dur" avant que dotenv soit chargé)
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),
    CacheModule,
    CategoriesModule,
    ProductsModule,
    SalesModule,
    DashboardModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // APP_GUARD : enregistre JwtAuthGuard comme guard GLOBAL, appliqué à TOUTES les routes
    // de l'application automatiquement -> pas besoin d'ajouter @UseGuards(JwtAuthGuard)
    // sur chaque controller un par un (et donc impossible d'oublier de protéger une route).
    // Seules les routes marquées @Public() (login/register) y échappent.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
