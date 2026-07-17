import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

const NAV_ITEMS = [
  { to: '/', label: 'Tableau de bord' },
  { to: '/products', label: 'Produits' },
  { to: '/sales', label: 'Ventes' },
];

export function Layout() {
  const { user, logout } = useAuth();
  // Menu mobile fermé par défaut ; ouvert/fermé indépendamment de la largeur d'écran
  // (les classes Tailwind `md:hidden` / `hidden md:flex` gèrent laquelle des deux versions s'affiche).
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <span className="font-display text-xl font-semibold text-brand-dark">WariStock</span>
            {/* Navigation desktop : visible à partir de md, cachée en dessous */}
            <nav className="hidden gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-soft text-brand-dark' : 'text-ink-soft hover:bg-paper'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Bloc droit desktop : nom, thème, déconnexion — caché sur mobile (remplacé par le menu) */}
          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />
            <span className="text-sm text-ink-soft">{user?.name}</span>
            <button
              onClick={logout}
              className="rounded-md border border-danger px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
            >
              Déconnexion
            </button>
          </div>

          {/* Bouton hamburger : visible uniquement en dessous de md */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Ouvrir le menu"
            className="rounded-md border border-border p-2 text-ink md:hidden"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Panneau mobile déroulant : navigation + actions, empilées verticalement */}
        {isMobileMenuOpen && (
          <div className="border-t border-border px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 text-sm font-medium ${
                      isActive ? 'bg-brand-soft text-brand-dark' : 'text-ink-soft hover:bg-paper'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-ink-soft">{user?.name}</span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="rounded-md border border-danger px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Outlet : injecte ici la page correspondant à la route active (react-router) */}
        <Outlet />
      </main>
    </div>
  );
}
