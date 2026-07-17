import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { dashboardApi } from '../api/dashboard.api';
import { Spinner } from '../components/Spinner';
import { getApiErrorMessage } from '../hooks/useApiError';
import type { DashboardData } from '../types';

// Chart.js exige un enregistrement explicite des "briques" utilisées (tree-shaking :
// on ne charge que ce dont on a besoin, pas la librairie entière avec tous les types de graphiques).
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' });

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'amber' | 'danger';
}

function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  const toneClass =
    tone === 'amber' ? 'text-amber' : tone === 'danger' ? 'text-danger' : 'text-ink';

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className={`ledger mt-2 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [revenueByDay, setRevenueByDay] = useState<{ label: string; total: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Deux appels indépendants en parallèle : les agrégats du dashboard (cartes),
    // ET la tendance de CA par jour — calculée CÔTÉ BACKEND via agrégation MongoDB
    // (voir SalesRepository.getRevenueByDay). Contrairement à une version antérieure
    // qui regroupait les 100 dernières ventes en JS ici, ce calcul reste exact quel
    // que soit le nombre total de ventes : le backend n'agrège que la fenêtre de jours
    // demandée, pas un échantillon arbitraire de N ventes.
    Promise.all([dashboardApi.get(), dashboardApi.getRevenueByDay(14)])
      .then(([dashboard, revenuePoints]) => {
        setData(dashboard);
        const formatted = revenuePoints.map((point) => ({
          label: shortDateFormatter.format(new Date(point.date)),
          total: point.total,
        }));
        setRevenueByDay(formatted);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <Spinner label="Chargement du tableau de bord..." />;

  if (error) {
    return <p className="rounded-md bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>;
  }

  if (!data) return null; // garde de type : après ce point, TS sait que `data` n'est pas null

  const availableCount = Math.max(
    data.totalProducts - data.lowStockCount - data.outOfStockCount,
    0,
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Tableau de bord</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Produits" value={String(data.totalProducts)} />
        <StatCard
          label="Stock faible"
          value={String(data.lowStockCount)}
          tone={data.lowStockCount > 0 ? 'amber' : 'default'}
        />
        <StatCard
          label="Rupture de stock"
          value={String(data.outOfStockCount)}
          tone={data.outOfStockCount > 0 ? 'danger' : 'default'}
        />
        <StatCard label="Valeur du stock" value={currencyFormatter.format(data.stockValue)} />
        <StatCard label="Chiffre d'affaires" value={currencyFormatter.format(data.totalRevenue)} />
      </div>

      {/* grid-cols-1 -> empilés sur mobile ; lg:grid-cols-2 -> côte à côte sur grand écran */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Répartition du stock</h2>
          {/* h-64 fixe + maintainAspectRatio:false : nécessaire pour que Chart.js
              redimensionne correctement dans un conteneur flexible (responsive). */}
          <div className="mt-4 h-64">
            <Doughnut
              data={{
                labels: ['Disponible', 'Stock faible', 'Rupture'],
                datasets: [
                  {
                    data: [availableCount, data.lowStockCount, data.outOfStockCount],
                    backgroundColor: ['#2f7d4f', '#c7702e', '#b23a3a'],
                    borderWidth: 0,
                  },
                ],
              }}
              options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Chiffre d'affaires par jour</h2>
          <div className="mt-4 h-64">
            {revenueByDay.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-ink-soft">
                Aucune vente à afficher.
              </p>
            ) : (
              <Bar
                data={{
                  labels: revenueByDay.map((d) => d.label),
                  datasets: [
                    {
                      label: 'Chiffre d\'affaires',
                      data: revenueByDay.map((d) => d.total),
                      backgroundColor: '#0f6b5c',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
