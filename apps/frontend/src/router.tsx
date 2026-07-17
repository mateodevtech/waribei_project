import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { RegisterPage } from './pages/RegisterPage';
import { SalesPage } from './pages/SalesPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    // ProtectedRoute vérifie l'auth AVANT de rendre Layout (et donc les pages enfants).
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/products', element: <ProductsPage /> },
          { path: '/sales', element: <SalesPage /> },
        ],
      },
    ],
  },
]);
