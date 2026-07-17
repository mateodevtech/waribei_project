import { useEffect, useState } from 'react';

// Retarde la mise à jour de la valeur retournée de `delayMs` après la dernière frappe.
// Sans ça, taper "riz" enverrait 3 requêtes (r, ri, riz) au lieu d'une seule.
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Cleanup : si `value` change avant la fin du délai (nouvelle frappe),
    // on annule le timer précédent -> seul le dernier déclenche réellement la mise à jour.
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
