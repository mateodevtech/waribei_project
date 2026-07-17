import { createContext, useContext, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth.api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Clé unique pour le user en localStorage, à côté du token déjà géré par client.ts.
const USER_STORAGE_KEY = 'authUser';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy initializer (fonction passée à useState) : lit localStorage UNE SEULE FOIS
  // au montage, pas à chaque re-render -> évite de re-parser du JSON inutilement.
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  function persistSession(accessToken: string, authUser: AuthUser) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }

  async function login(email: string, password: string) {
    const { accessToken, user: authUser } = await authApi.login({ email, password });
    persistSession(accessToken, authUser);
  }

  async function register(name: string, email: string, password: string) {
    const { accessToken, user: authUser } = await authApi.register({ name, email, password });
    persistSession(accessToken, authUser);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook custom : évite de répéter useContext(AuthContext) + le check "undefined" partout.
// Le check throw est volontaire : utiliser useAuth() HORS d'un <AuthProvider> est un bug
// de code (mauvais emplacement du composant), pas un cas à gérer silencieusement.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() doit être utilisé à l’intérieur de <AuthProvider>');
  }
  return context;
}
