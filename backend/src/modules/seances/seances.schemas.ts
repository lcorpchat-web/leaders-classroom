import { z } from 'zod';
import { dateJour, uuid } from '../../utils/schemas.js';

/** Date et heure ISO 8601 (ex. 2026-11-02T13:00:00.000Z) */
const dateHeure = z.iso.datetime({ offset: true, message: 'Date et heure invalides' }).transform((v) => new Date(v));

const titre = z.string().trim().min(1, 'Titre requis').max(150);
/** De 15 minutes à 8 heures */
const dureeMinutes = z.number().int().min(15, '15 minutes minimum').max(480, '8 heures maximum');

export const creationSeanceSchema = z.object({
  titre,
  debut: dateHeure,
  dureeMinutes,
  /** Administrateur : enseignant animateur, parmi les enseignants affectés à la classe */
  enseignantId: uuid.optional(),
  /** Amélioration (maquette 04) : répéter la séance chaque semaine jusqu'à cette date incluse */
  repetition: z.object({ jusquAu: dateJour }).optional(),
});

export const modificationSeanceSchema = z
  .object({ titre, debut: dateHeure, dureeMinutes })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Aucune modification fournie' });

export const planningSchema = z
  .object({
    debut: dateHeure,
    fin: dateHeure,
    classeId: uuid.optional(),
  })
  .refine((d) => d.fin > d.debut, { path: ['fin'], message: 'La fin doit suivre le début' })
  .refine((d) => d.fin.getTime() - d.debut.getTime() <= 120 * 24 * 3600 * 1000, {
    path: ['fin'],
    message: 'Période de 120 jours maximum',
  });

export type CreationSeance = z.infer<typeof creationSeanceSchema>;
export type ModificationSeance = z.infer<typeof modificationSeanceSchema>;
export type Planning = z.infer<typeof planningSchema>;
