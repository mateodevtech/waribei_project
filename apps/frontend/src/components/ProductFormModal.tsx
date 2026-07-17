import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { categoriesApi } from '../api/categories.api';
import { productsApi, type ProductInput } from '../api/products.api';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../hooks/useApiError';
import type { Category, Product } from '../types';

interface ProductFormModalProps {
  product: Product | null; // null = création, sinon édition
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  // Remonte une catégorie nouvellement créée au parent (ProductsPage), qui détient
  // la vraie liste des catégories -> évite que ce formulaire gère un état dupliqué.
  onCategoryCreated: (category: Category) => void;
}

export function ProductFormModal({
  product,
  categories,
  onClose,
  onSaved,
  onCategoryCreated,
}: ProductFormModalProps) {
  const isEditing = product !== null;
  const { showToast } = useToast();

  const [name, setName] = useState(product?.name ?? '');
  const [categoryId, setCategoryId] = useState(product?.category._id ?? categories[0]?._id ?? '');
  const [unitPrice, setUnitPrice] = useState(product?.unitPrice.toString() ?? '');
  const [quantity, setQuantity] = useState(product?.quantity.toString() ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État local, isolé, pour la création rapide de catégorie (n'affecte pas le reste du formulaire).
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [isCreatingCategorySubmitting, setIsCreatingCategorySubmitting] = useState(false);

  async function handleCreateCategory(e: FormEvent) {
    e.preventDefault();
    setCategoryError(null);
    if (!newCategoryName.trim()) {
      setCategoryError('Le nom de la catégorie est obligatoire.');
      return;
    }
    setIsCreatingCategorySubmitting(true);
    try {
      const created = await categoriesApi.create({ name: newCategoryName.trim() });
      onCategoryCreated(created); // met à jour la liste au niveau du parent
      setCategoryId(created._id); // sélectionne directement la catégorie qu'on vient de créer
      setNewCategoryName('');
      setIsCreatingCategory(false);
      showToast('success', `Catégorie "${created.name}" créée avec succès.`);
    } catch (err) {
      setCategoryError(getApiErrorMessage(err));
    } finally {
      setIsCreatingCategorySubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation cliente : miroir des règles du backend, pour un retour immédiat
    // SANS attendre l'aller-retour réseau. Le backend reste la source de vérité finale
    // (jamais confiance aveugle à cette seule validation cliente).
    const parsedPrice = Number(unitPrice);
    const parsedQuantity = Number(quantity);
    if (!name.trim() || !categoryId) {
      setError('Le nom et la catégorie sont obligatoires.');
      return;
    }
    if (!(parsedPrice > 0)) {
      setError('Le prix doit être supérieur à 0.');
      return;
    }
    if (parsedQuantity < 0) {
      setError('La quantité ne peut pas être négative.');
      return;
    }

    const payload: ProductInput = {
      name: name.trim(),
      category: categoryId,
      unitPrice: parsedPrice,
      quantity: parsedQuantity,
    };

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await productsApi.update(product._id, payload);
      } else {
        await productsApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay px-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
        <h2 className="font-display text-lg font-semibold text-ink">
          {isEditing ? 'Modifier le produit' : 'Nouveau produit'}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="product-name" className="mb-1 block text-sm font-medium text-ink">
              Nom
            </label>
            <input
              id="product-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="product-category" className="block text-sm font-medium text-ink">
                Catégorie
              </label>
              {!isCreatingCategory && (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                >
                  <Plus size={14} /> Nouvelle catégorie
                </button>
              )}
            </div>

            {isCreatingCategory ? (
              // Mini-formulaire inline : pas besoin d'ouvrir une deuxième modale
              // par-dessus celle-ci pour une simple création de catégorie.
              <div className="rounded-md border border-border bg-paper p-3">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    placeholder="Nom de la catégorie"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    disabled={isCreatingCategorySubmitting}
                    className="shrink-0 rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingCategory(false);
                      setCategoryError(null);
                      setNewCategoryName('');
                    }}
                    className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface"
                  >
                    Annuler
                  </button>
                </div>
                {categoryError && <p className="mt-2 text-xs text-danger">{categoryError}</p>}
              </div>
            ) : (
              <select
                id="product-category"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
              >
                {categories.length === 0 && <option value="">Aucune catégorie</option>}
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-price" className="mb-1 block text-sm font-medium text-ink">
                Prix unitaire
              </label>
              <input
                id="product-price"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="ledger w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
              />
            </div>
            <div>
              <label htmlFor="product-quantity" className="mb-1 block text-sm font-medium text-ink">
                Quantité
              </label>
              <input
                id="product-quantity"
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="ledger w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
