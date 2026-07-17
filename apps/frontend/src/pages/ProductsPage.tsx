import { useEffect, useState } from 'react';
import { categoriesApi } from '../api/categories.api';
import { productsApi } from '../api/products.api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Pagination } from '../components/Pagination';
import { ProductFormModal } from '../components/ProductFormModal';
import { SaleFormModal } from '../components/SaleFormModal';
import { Spinner } from '../components/Spinner';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { getApiErrorMessage } from '../hooks/useApiError';
import type { Category, PaginatedResult, Product } from '../types';

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

export function ProductsPage() {
  const { showToast } = useToast();

  const [result, setResult] = useState<PaginatedResult<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search); // évite un appel API à chaque frappe
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  // Page volontairement petite (4) : avec les 5 produits du seed, la pagination est
  // immédiatement visible et testable sans devoir créer des données supplémentaires.
  // Un bénéfice secondaire : moins de lignes par page = plus confortable sur mobile.
  const PAGE_SIZE = 4;

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Charger les catégories une seule fois (nécessaires pour le filtre ET le formulaire produit).
  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => {
      // Silencieux ici : si les catégories échouent à charger, le filtre reste juste vide,
      // ce n'est pas bloquant pour la page — mais la liste de produits, elle, a son propre état d'erreur.
    });
  }, []);

  // Reset de la page géré directement dans les handlers ci-dessous (pas par un effet
  // séparé qui observerait search/categoryFilter) : évite qu'un changement de filtre
  // déclenche DEUX fetchs consécutifs (un avec l'ancienne page, un avec la page 1 corrigée).
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    setPage(1);
  }

  function fetchProducts() {
    setIsLoading(true);
    setError(null);
    productsApi
      .getAll({
        search: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        page,
        limit: PAGE_SIZE,
      })
      .then(setResult)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  useEffect(fetchProducts, [debouncedSearch, categoryFilter, page]);

  async function handleDelete() {
    if (!deletingProduct) return;
    try {
      await productsApi.remove(deletingProduct._id);
      showToast('success', `"${deletingProduct.name}" a été supprimé.`);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Produits</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          + Nouveau produit
        </button>
      </div>

      {/* Recherche + filtre : les deux vivent côté backend (voir la justification dans le README) */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Rechercher un produit par nom..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft sm:max-w-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft sm:w-auto"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        {isLoading ? (
          <Spinner />
        ) : error ? (
          <p className="px-6 py-8 text-sm text-danger">{error}</p>
        ) : !result || result.data.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-ink-soft">
            Aucun produit ne correspond à votre recherche.
          </p>
        ) : (
          <>
            {/* Vue TABLEAU : écrans larges (md et plus). Une table est illisible sur mobile
                (colonnes trop nombreuses pour un écran étroit -> scroll horizontal pénible). */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-border bg-paper text-xs uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3">Prix</th>
                  <th className="px-4 py-3">Quantité</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((product) => (
                  <tr key={product._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{product.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{product.category.name}</td>
                    <td className="ledger px-4 py-3 text-ink">
                      {currencyFormatter.format(product.unitPrice)}
                    </td>
                    <td className="ledger px-4 py-3 text-ink">{product.quantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setSellingProduct(product)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper"
                        >
                          Vendre
                        </button>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:bg-paper"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-soft"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vue CARTES : mobile uniquement (en dessous de md). Même information,
                réorganisée verticalement -> lisible sans scroll horizontal. */}
            <ul className="divide-y divide-border md:hidden">
              {result.data.map((product) => (
                <li key={product._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{product.name}</p>
                      <p className="text-xs text-ink-soft">{product.category.name}</p>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>
                  <div className="ledger mt-2 flex gap-4 text-sm text-ink-soft">
                    <span>{currencyFormatter.format(product.unitPrice)}</span>
                    <span>Qté : {product.quantity}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSellingProduct(product)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      Vendre
                    </button>
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-danger"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {result && (
        <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPageChange={setPage} />
      )}

      {showCreateForm && (
        <ProductFormModal
          product={null}
          categories={categories}
          onClose={() => setShowCreateForm(false)}
          onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
          onSaved={() => {
            setShowCreateForm(false);
            showToast('success', 'Produit créé avec succès.');
            fetchProducts();
          }}
        />
      )}

      {editingProduct && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
          onSaved={() => {
            setEditingProduct(null);
            showToast('success', 'Produit modifié avec succès.');
            fetchProducts();
          }}
        />
      )}

      {sellingProduct && (
        <SaleFormModal
          product={sellingProduct}
          onClose={() => setSellingProduct(null)}
          onSaved={() => {
            setSellingProduct(null);
            showToast('success', 'Vente enregistrée avec succès.');
            fetchProducts(); // le stock a changé -> rafraîchir la liste
          }}
        />
      )}

      {deletingProduct && (
        <ConfirmDialog
          title="Supprimer ce produit ?"
          message={`"${deletingProduct.name}" sera définitivement supprimé.`}
          confirmLabel="Supprimer"
          isDangerous
          onCancel={() => setDeletingProduct(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
