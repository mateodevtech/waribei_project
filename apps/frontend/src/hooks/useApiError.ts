import axios from 'axios';
import type { ApiErrorResponse } from '../types';

// Centralise la lecture du format d'erreur renvoyé par AllExceptionsFilter côté backend.
// Sans cette fonction, chaque composant devrait connaître la forme exacte de la réponse
// d'erreur (statusCode/message/etc.) -> dupliqué partout, fragile si le format change.
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) {
      // class-validator peut renvoyer PLUSIEURS messages (un par règle violée) ->
      // on les joint proprement plutôt que d'afficher "[object Object]".
      return message.join(' ');
    }
    if (typeof message === 'string') {
      return message;
    }
  }
  return 'Une erreur inattendue est survenue. Réessayez.';
}
