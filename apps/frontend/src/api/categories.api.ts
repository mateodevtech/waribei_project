import { apiClient } from './client';
import type { Category } from '../types';

export const categoriesApi = {
  getAll: () => apiClient.get<Category[]>('/categories').then((res) => res.data),

  create: (data: { name: string }) =>
    apiClient.post<Category>('/categories', data).then((res) => res.data),
};
