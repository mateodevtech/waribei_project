export function Spinner({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-ink-soft">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand"
        aria-hidden="true"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
