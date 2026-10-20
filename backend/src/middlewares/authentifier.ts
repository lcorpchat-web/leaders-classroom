import type { RequestHandler } from 'express';
import { trouverUtilisateurActif } from '../modules/auth/auth.service.js';
import { COOKIE_SESSION, fermerSession, lireJeton } from '../modules/auth/session.js';
import { HttpError } from '../utils/http-error.js';

/**
 * Exige un jeton de session valide (section 11 : toutes les routes sauf la connexion).
 * L'utilisateur est rechargé en base à chaque requête : un compte désactivé perd l'accès
 * immédiatement (RG7), même si son jeton n'a pas expiré.
 */
export const authentifier: RequestHandler = async (req, res, next) => {
  const jeton: unknown = req.cookies?.[COOKIE_SESSION];
  const session = typeof jeton === 'string' ? lireJeton(jeton) : null;
  const utilisateur = session ? await trouverUtilisateurActif(session.sub) : null;

  if (!utilisateur) {
    if (jeton) fermerSession(res);
    throw new HttpError(401, 'Session absente ou expirée', 'NON_AUTHENTIFIE');
  }

  req.utilisateur = utilisateur;
  next();
};
