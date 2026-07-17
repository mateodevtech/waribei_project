import { apiClient } from './client';
import type { DashboardData, RevenueByDayPoint } from '../types';

export const dashboardApi = {
  get: () => apiClient.get<DashboardData>('/dashboard').then((res) => res.data),
  // Calculé côté backend (agrégation MongoDB) -> reste exact même quand l'historique
  // des ventes grossit, contrairement à un calcul client sur un échantillon limité.
  getRevenueByDay: (days = 14) =>
    apiClient
      .get<RevenueByDayPoint[]>('/dashboard/revenue-by-day', { params: { days } })
      .then((res) => res.data),
};
