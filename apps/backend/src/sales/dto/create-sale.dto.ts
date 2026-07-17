import { IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';

// Volontairement, PAS de champ unitPrice ni totalAmount ici.
// Règle de sécurité/métier fondamentale : on ne fait JAMAIS confiance au prix envoyé
// par le client. Le prix utilisé pour une vente est TOUJOURS relu depuis la base
// (Product.unitPrice) au moment de la transaction, côté serveur.
// Sinon, un client malveillant pourrait envoyer { unitPrice: 1 } pour un produit à 5000.
export class CreateSaleDto {
  @IsNotEmpty({ message: 'Le produit est obligatoire' })
  @IsMongoId({ message: 'Le produit doit être un identifiant valide' })
  product: string;

  @IsNumber({}, { message: 'La quantité doit être un nombre' })
  @Min(1, { message: 'La quantité vendue doit être supérieure à 0' })
  quantitySold: number;
}
