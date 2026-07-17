// Ces types reflètent EXACTEMENT ce que l'API backend renvoie (voir les schémas Mongoose
// et les DTOs côté backend). Les garder synchronisés manuellement est un compromis assumé
// ici (pas de génération automatique de types depuis Swagger) — acceptable pour un test
// technique avec deux personnes (toi) qui contrôlent les deux bouts de la chaîne.

export interface Category {
  _id: string;
  name: string;
}

export type StockStatus = 'Disponible' | 'Stock faible' | 'Rupture';

export interface Product {
  _id: string;
  name: string;
  category: Category; // populate() côté backend -> objet complet, pas juste un ID
  unitPrice: number;
  quantity: number;
  status: StockStatus; // virtual Mongoose, calculé côté backend
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  _id: string;
  product: Product;
  quantitySold: number;
  unitPrice: number;
  totalAmount: number;
  date: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardData {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  stockValue: number;
  totalRevenue: number;
}

export interface RevenueByDayPoint {
  date: string; // "YYYY-MM-DD"
  total: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// Forme générique d'une erreur renvoyée par AllExceptionsFilter côté backend.
export interface ApiErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string | string[];
}
