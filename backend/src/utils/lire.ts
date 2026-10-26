import type { z } from 'zod';
import { HttpError } from './http-error.js';

/**
 * Valide des données entrantes (corps, paramètres ou query) avec un schéma zod.
 * Lève une erreur 400 détaillant les champs invalides.
 */
export function lire<S extends z.ZodType>(schema: S, donnees: unknown): z.output<S> {
  const resultat = schema.safeParse(donnees ?? {});
  if (!resultat.success) {
    throw new HttpError(
      400,
      'Données invalides',
      'DONNEES_INVALIDES',
      resultat.error.issues.map((issue) => ({ champ: issue.path.join('.'), message: issue.message })),
    );
  }
  return resultat.data;
}
