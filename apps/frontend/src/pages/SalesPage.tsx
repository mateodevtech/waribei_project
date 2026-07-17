import { useEffect, useState } from 'react';
import { salesApi } from '../api/sales.api';
import { Pagination } from '../components/Pagination';
import { Spinner } from '../components/Spinner';
import { getApiErrorMessage } from '../hooks/useApiError';
import type { PaginatedResult, Sale } from '../types';

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

// Page volontairement petite (2) : avec seulement 3 ventes dans le seed, une valeur
// plus grande (5, 10...) masquerait totalement la pagination (1 seule page = composant
// caché). Même logique que ProductsPage : rendre la pagination visible et testable
// sans devoir créer des dizaines de ventes à la main.
const PAGE_SIZE = 2;

export function SalesPage() {
  const [result, setResult] = useState<PaginatedResult<Sale> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    salesApi
      .getAll({ page, limit: PAGE_SIZE })
      // Le tri "plus récent en premier" est déjà fait côté backend (.sort({ date: -1 }))
      // -> le frontend affiche simplement l'ordre reçu, aucune logique de tri à dupliquer ici.
      .then(setResult)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Historique des ventes</h1>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <p className="px-6 py-8 text-sm text-danger">{error}</p>
        ) : !result || result.data.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-soft">
            Aucune vente enregistrée pour le moment.
          </p>
        ) : (
          <>
            {/* Vue TABLEAU : écrans larges. */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-border bg-paper text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Produit</th>
                  <th className="px-4 py-3">Quantité</th>
                  <th className="px-4 py-3">Prix unitaire</th>
                  <th className="px-4 py-3">Montant total</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((sale) => (
                  <tr key={sale._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">
                      {/* product a pu être supprimé depuis -> garde défensive d'affichage */}
                      {sale.product?.name ?? 'Produit supprimé'}
                    </td>
                    <td className="ledger px-4 py-3 text-ink">{sale.quantitySold}</td>
                    <td className="ledger px-4 py-3 text-ink">
                      {currencyFormatter.format(sale.unitPrice)}
                    </td>
                    <td className="ledger px-4 py-3 font-semibold text-ink">
                      {currencyFormatter.format(sale.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {dateFormatter.format(new Date(sale.date))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vue CARTES : mobile uniquement. */}
            <ul className="divide-y divide-border md:hidden">
              {result.data.map((sale) => (
                <li key={sale._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">{sale.product?.name ?? 'Produit supprimé'}</p>
                    <p className="ledger font-semibold text-ink">
                      {currencyFormatter.format(sale.totalAmount)}
                    </p>
                  </div>
                  <div className="ledger mt-1 flex gap-4 text-sm text-ink-soft">
                    <span>Qté : {sale.quantitySold}</span>
                    <span>{currencyFormatter.format(sale.unitPrice)} / unité</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{dateFormatter.format(new Date(sale.date))}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {result && (
        <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
