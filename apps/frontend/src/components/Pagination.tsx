interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null; // rien à paginer -> ne pas afficher un contrôle inutile

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface"
      >
        Précédent
      </button>
      <span className="ledger text-sm text-ink-soft">
        Page {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-surface"
      >
        Suivant
      </button>
    </div>
  );
}
