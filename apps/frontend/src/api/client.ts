import axios from 'axios';

// import.meta.env.VITE_API_URL : Vite n'expose QUE les variables préfixées "VITE_"
// au code frontend (sécurité : évite qu'une variable serveur sensible fuite dans le bundle
// livré au navigateur). Toute variable d'env utilisée ici DOIT commencer par ce préfixe.
const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({ baseURL });

// Intercepteur de REQUÊTE : attache le token JWT à CHAQUE appel sortant automatiquement.
// Alternative rejetée : ajouter le header manuellement dans chaque fonction api/*.ts
// -> aurait fonctionné, mais risque d'oubli à chaque nouvel appel ajouté plus tard.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de REPONSE : si le backend renvoie 401 (token expiré/invalide),
// on déconnecte proprement l'utilisateur plutôt que de le laisser sur un écran
// qui semble connecté mais dont chaque action échoue silencieusement.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      // Redirection "dure" (pas via react-router) : volontaire ici, cet intercepteur
      // vit en dehors de l'arbre React et n'a pas accès à useNavigate().
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
