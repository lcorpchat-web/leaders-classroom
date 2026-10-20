import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

/**
 * Valide et normalise le corps de la requête avec un schéma zod.
 * En cas d'échec : 400 avec le détail des champs invalides.
 */
export function valider(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const resultat = schema.safeParse(req.body ?? {});
    if (!resultat.success) {
      res.status(400).json({
        error: {
          code: 'DONNEES_INVALIDES',
          message: 'Données invalides',
          champs: resultat.error.issues.map((issue) => ({ champ: issue.path.join('.'), message: issue.message })),
        },
      });
      return;
    }
    req.body = resultat.data;
    next();
  };
}
