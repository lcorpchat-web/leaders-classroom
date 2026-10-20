import type { RequestHandler } from 'express';
import type { Role } from '../generated/prisma/client.js';
import { HttpError } from '../utils/http-error.js';

/**
 * Contrôle des rôles (RBAC, section 12). À placer après authentifier :
 *   router.post('/', authentifier, autoriser('ADMIN'), handler)
 * Les règles fines (RG2, RG4 : appartenance à la classe) sont vérifiées en base dans les modules métier.
 */
export function autoriser(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.utilisateur) {
      throw new HttpError(401, 'Session absente ou expirée', 'NON_AUTHENTIFIE');
    }
    if (!roles.includes(req.utilisateur.role)) {
      throw new HttpError(403, 'Accès refusé', 'ACCES_REFUSE');
    }
    next();
  };
}
