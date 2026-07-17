// Un enum plutôt que des strings libres partout dans le code :
// évite les fautes de frappe ("Rupture" vs "rupture" vs "RUPTURE") et centralise les valeurs.
// Constante partagée : utilisée à la fois par computeStockStatus() (lecture d'un document)
// ET par le pipeline d'agrégation MongoDB du Dashboard (qui ne peut pas exécuter cette
// fonction JS côté serveur Mongo, mais peut réutiliser la MÊME valeur numérique).
// Un seul endroit à changer si demain la règle métier évolue (ex: seuil à 10 au lieu de 5).
export const LOW_STOCK_THRESHOLD = 5;

export enum StockStatus {
  AVAILABLE = 'Disponible',
  LOW_STOCK = 'Stock faible',
  OUT_OF_STOCK = 'Rupture',
}

export function computeStockStatus(quantity: number): StockStatus {
  if (quantity === 0) return StockStatus.OUT_OF_STOCK;
  if (quantity <= LOW_STOCK_THRESHOLD) return StockStatus.LOW_STOCK;
  return StockStatus.AVAILABLE;
}
