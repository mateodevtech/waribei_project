import { useState, type FormEvent } from 'react';
import { salesApi } from '../api/sales.api';
import { getApiErrorMessage } from '../hooks/useApiError';
import type { Product } from '../types';

interface SaleFormModalProps {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

export function SaleFormModal({ product, onClose, onSaved }: SaleFormModalProps) {
  // Rupture de stock : cas particulier, pas juste une variante de "stock insuffisant".
  // On le détecte AVANT toute saisie (pas seulement au submit) pour respecter la consigne
  // de l'énoncé au pied de la lettre : "la vente doit être refusée avec un message
  // compréhensible" — le message doit être visible dès l'ouverture, pas seulement après
  // une tentative de soumission que l'utilisateur pourrait ne jamais faire.
  const isOutOfStock = product.quantity === 0;

  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(
    isOutOfStock
      ? `"${product.name}" est en rupture de stock. La vente est refusée : aucune unité disponible.`
      : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedQuantity = Number(quantity);
  const total = Number.isFinite(parsedQuantity) ? parsedQuantity * product.unitPrice : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isOutOfStock) {
      // Garde-fou : ce cas ne devrait jamais arriver (input + bouton déjà désactivés
      // ci-dessous), mais on ne fait JAMAIS confiance uniquement à l'état désactivé
      // d'un élément HTML — un submit peut être déclenché autrement (touche Entrée, etc.).
      return;
    }

    setError(null);

    // Miroir des règles métier du backend, pour un retour immédiat :
    // le backend reste la seule source de vérité (notamment pour le stock,
    // vérifié de façon atomique côté serveur — voir la déduction atomique du backend).
    if (!(parsedQuantity > 0)) {
      setError('La quantité doit être supérieure à 0.');
      return;
    }
    if (parsedQuantity > product.quantity) {
      setError(`Stock insuffisant : seulement ${product.quantity} unité(s) disponible(s).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await salesApi.create({ product: product._id, quantitySold: parsedQuantity });
      onSaved();
    } catch (err) {
      // Le backend peut AUSSI refuser (ex: une autre vente concurrente a épuisé le stock
      // entre l'affichage de cette page et la soumission) -> ce catch reste indispensable
      // même après la vérification cliente ci-dessus.
      setError(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay px-4">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
        <h2 className="font-display text-lg font-semibold text-ink">Enregistrer une vente</h2>
        <p className="mt-1 text-sm text-ink-soft">{product.name}</p>
        <p className="ledger mt-1 text-xs text-ink-soft">
          Stock disponible : {product.quantity} · Prix unitaire : {currencyFormatter.format(product.unitPrice)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="sale-quantity" className="mb-1 block text-sm font-medium text-ink">
              Quantité vendue
            </label>
            <input
              id="sale-quantity"
              type="number"
              min="1"
              max={product.quantity}
              required
              disabled={isOutOfStock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="ledger w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-soft disabled:cursor-not-allowed disabled:bg-paper disabled:opacity-60"
            />
          </div>

          <p className="ledger text-sm text-ink-soft">
            Montant total : <span className="font-semibold text-ink">{currencyFormatter.format(total)}</span>
          </p>

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
              disabled={isSubmitting || isOutOfStock}
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {isSubmitting ? 'Enregistrement...' : isOutOfStock ? 'Vente refusée' : 'Confirmer la vente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
