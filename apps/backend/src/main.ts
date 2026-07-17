import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  // Le plugin CLI "@nestjs/swagger" (activé dans nest-cli.json) introspecte automatiquement
  // les types de chaque DTO à la compilation -> pas besoin d'ajouter @ApiProperty() sur
  // chaque champ manuellement, la documentation reste synchronisée avec le code sans effort.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mini WariStock API')
    .setDescription('API de gestion de stock et de ventes pour un commerçant — test technique Waribei')
    .setVersion('1.0')
    .addBearerAuth() // ajoute le bouton "Authorize" dans l'UI Swagger pour coller un token JWT
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document); // accessible sur /api-docs

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
