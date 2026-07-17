import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AppModule } from '../app.module';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Sale, SaleDocument } from '../sales/schemas/sale.schema';

/**
 * On récupère les modèles Mongoose DIRECTEMENT (pas via les Services) volontairement :
 * un script de seed a pour unique responsabilité d'insérer des données brutes de départ,
 * pas d'appliquer les règles métier (vérification d'unicité, etc.) qui supposent
 * un système déjà "en vie" avec des utilisateurs qui l'utilisent. On garde donc
 * ce script isolé du reste de la logique applicative -> c'est un outil, pas une fonctionnalité.
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryModel = app.get<Model<CategoryDocument>>(getModelToken(Category.name));
  const productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));
  const saleModel = app.get<Model<SaleDocument>>(getModelToken(Sale.name));

  const existingCount = await categoryModel.countDocuments();
  if (existingCount > 0) {
    console.log('⚠️  Des données existent déjà — seed annulé pour éviter les doublons.');
    console.log('   (Videz la base manuellement si vous voulez re-seed depuis zéro.)');
    await app.close();
    return;
  }

  console.log('🌱 Insertion des catégories...');
  const [alimentaire, boissons] = await categoryModel.create([
    { name: 'Alimentaire' },
    { name: 'Boissons' },
  ]);

  console.log('🌱 Insertion des produits...');
  const [riz, huile, sucre, eau, jus] = await productModel.create([
    { name: 'Riz parfumé 5kg', category: alimentaire._id, unitPrice: 5000, quantity: 15 },
    { name: 'Huile de palme 1L', category: alimentaire._id, unitPrice: 1500, quantity: 3 }, // Stock faible
    { name: 'Sucre en poudre 1kg', category: alimentaire._id, unitPrice: 800, quantity: 0 }, // Rupture
    { name: 'Eau minérale 1.5L', category: boissons._id, unitPrice: 500, quantity: 40 },
    { name: "Jus d'orange 1L", category: boissons._id, unitPrice: 1200, quantity: 4 }, // Stock faible
  ]);

  console.log('🌱 Insertion des ventes...');
  // Les quantités des produits ci-dessus reflètent déjà l'état APRÈS ces ventes
  // (cohérence des données de seed, comme si les ventes avaient déjà eu lieu).
  await saleModel.create([
    {
      product: riz._id,
      quantitySold: 5,
      unitPrice: 5000,
      totalAmount: 25000,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // il y a 2 jours
    },
    {
      product: eau._id,
      quantitySold: 10,
      unitPrice: 500,
      totalAmount: 5000,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // il y a 1 jour
    },
    {
      product: jus._id,
      quantitySold: 2,
      unitPrice: 1200,
      totalAmount: 2400,
      date: new Date(),
    },
  ]);

  console.log('✅ Seed terminé : 2 catégories, 5 produits, 3 ventes.');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Erreur pendant le seed :', err);
  process.exit(1);
});
