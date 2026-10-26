import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { lire } from '../utils/lire.js';

/** Valide et normalise le corps de la requête avec un schéma zod (400 si invalide). */
export function valider(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = lire(schema, req.body);
    next();
  };
}
