import { apiClient } from './client';
import type { AuthResponse } from '../types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((res) => res.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((res) => res.data),
};
