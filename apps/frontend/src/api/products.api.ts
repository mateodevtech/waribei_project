import { apiClient } from './client';
import type { PaginatedResult, Product } from '../types';

export interface ProductQuery {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ProductInput {
  name: string;
  category: string; // ID de catégorie
  unitPrice: number;
  quantity: number;
}

export const productsApi = {
  // params avec des valeurs undefined : axios les omet automatiquement de l'URL
  // (pas besoin de construire la query string à la main ni de filtrer les undefined).
  getAll: (query: ProductQuery) =>
    apiClient
      .get<PaginatedResult<Product>>('/products', { params: query })
      .then((res) => res.data),

  getOne: (id: string) => apiClient.get<Product>(`/products/${id}`).then((res) => res.data),

  create: (data: ProductInput) =>
    apiClient.post<Product>('/products', data).then((res) => res.data),

  update: (id: string, data: Partial<ProductInput>) =>
    apiClient.patch<Product>(`/products/${id}`, data).then((res) => res.data),

  remove: (id: string) => apiClient.delete(`/products/${id}`).then((res) => res.data),
};
