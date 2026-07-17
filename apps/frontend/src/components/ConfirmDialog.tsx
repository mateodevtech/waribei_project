interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmer',
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-overlay px-4">
      <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-xl bg-surface p-6 shadow-lg">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
              isDangerous ? 'bg-danger hover:bg-danger/90' : 'bg-brand hover:bg-brand-dark'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
