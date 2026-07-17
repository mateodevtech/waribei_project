import { apiClient } from './client';
import type { PaginatedResult, Sale } from '../types';

export interface SaleQuery {
  page?: number;
  limit?: number;
}

export const salesApi = {
  getAll: (query: SaleQuery) =>
    apiClient.get<PaginatedResult<Sale>>('/sales', { params: query }).then((res) => res.data),

  create: (data: { product: string; quantitySold: number }) =>
    apiClient.post<Sale>('/sales', data).then((res) => res.data),
};
