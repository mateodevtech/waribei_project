import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  // Rappel : ceci protège l'AFFICHAGE frontend seulement (confort utilisateur, pas de sécurité réelle).
  // La vraie protection est le JwtAuthGuard côté backend (voir erreur/piège #7 du backend) —
  // un utilisateur qui bricole son état local ne pourrait de toute façon appeler aucune route protégée.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
