import type { StockStatus } from '../types';

// Le mapping couleur <-> statut encode une vraie info métier (cf. skill design :
// "structure is information, not decoration") : vert = ok, ambre = attention, rouge = urgent.
const STYLES: Record<StockStatus, string> = {
  Disponible: 'bg-success-soft text-success',
  'Stock faible': 'bg-amber-soft text-amber',
  Rupture: 'bg-danger-soft text-danger',
};

export function StatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {status}
    </span>
  );
}
