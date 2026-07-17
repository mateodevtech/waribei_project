import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { router } from './router';

export default function App() {
  return (
    // ThemeProvider en premier : pose la classe .dark sur <html> avant tout rendu visuel.
    // ToastProvider englobe AuthProvider pour que showToast() reste disponible même
    // sur les pages Login/Register (avant authentification).
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
