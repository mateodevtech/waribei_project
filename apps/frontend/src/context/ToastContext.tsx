import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

type ToastType = 'success' | 'error';
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 0; // compteur simple pour des clés React uniques, pas besoin d'un uuid pour ce cas

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // useCallback : cette fonction est passée dans la valeur du Context, donc potentiellement
  // reçue par de nombreux composants -> éviter d'en recréer une nouvelle référence à chaque render.
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    // Disparition automatique après 4s -> pas besoin d'action utilisateur pour "fermer"
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed inset-x-4 top-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex w-full max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg sm:w-auto ${
              toast.type === 'success'
                ? 'bg-success-soft text-success border border-success'
                : 'bg-danger-soft text-danger border border-danger'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <XCircle size={18} className="shrink-0" />
            )}
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast() doit être utilisé à l’intérieur de <ToastProvider>');
  }
  return context;
}
