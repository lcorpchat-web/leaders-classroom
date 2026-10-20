import type { UtilisateurSession } from '../modules/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      /** Utilisateur authentifié, renseigné par le middleware authentifier */
      utilisateur?: UtilisateurSession;
    }
  }
}

export {};
