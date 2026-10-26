import { z } from 'zod';

/** Schémas réutilisables entre modules. */

export const uuid = z.uuid({ message: 'Identifiant invalide' });

export const idParams = z.object({ id: uuid });

/** Date au format AAAA-MM-JJ convertie en Date (minuit UTC) */
export const dateJour = z.iso.date({ message: 'Date invalide (AAAA-MM-JJ)' }).transform((v) => new Date(v));

/** Texte libre facultatif : chaîne vide ⇒ null */
export const texteFacultatif = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullish();

/** Booléen passé en query string ("true" / "false") */
export const booleenQuery = z.enum(['true', 'false']).transform((v) => v === 'true');
