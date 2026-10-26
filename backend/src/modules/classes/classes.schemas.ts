import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination.js';
import { booleenQuery, dateJour, texteFacultatif, uuid } from '../../utils/schemas.js';

const nom = z.string().trim().min(1, 'Nom requis').max(150);
const capaciteMax = z.number().int().min(1, 'Au moins 1 place').max(1000).nullish();

/** Maquette 04 : catégorie, niveau et langue d'enseignement (texte libre) */
const informations = {
  categorie: texteFacultatif(60),
  niveau: texteFacultatif(30),
  langue: texteFacultatif(40),
};

export const listeClassesSchema = paginationSchema.extend({
  active: booleenQuery.optional(),
  recherche: z.string().trim().max(100).optional(),
});

export const creationClasseSchema = z
  .object({
    nom,
    description: texteFacultatif(2000),
    dateDebut: dateJour,
    dateFin: dateJour.nullish(),
    capaciteMax,
    ...informations,
    /** RG1 : une classe est animée par au moins un enseignant — affectés dès la création */
    enseignantIds: z.array(uuid).min(1, 'Affectez au moins un enseignant').max(10),
  })
  .refine((d) => !d.dateFin || d.dateFin >= d.dateDebut, {
    path: ['dateFin'],
    message: 'La date de fin doit suivre la date de début',
  });

export const modificationClasseSchema = z
  .object({
    nom,
    description: texteFacultatif(2000),
    dateDebut: dateJour,
    dateFin: dateJour.nullable(),
    capaciteMax,
    ...informations,
    active: z.boolean(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Aucune modification fournie' });

export const affectationSchema = z.object({ enseignantId: uuid });
export const inscriptionSchema = z.object({ apprenantId: uuid });

/** Transitions manuelles de la figure 11 : valider / réinscrire (→ VALIDEE), refuser / retirer (→ RETIREE) */
export const statutInscriptionSchema = z.object({
  statut: z.enum(['VALIDEE', 'RETIREE'], { message: 'Statut invalide' }),
});

export const affectationParams = z.object({ id: uuid, enseignantId: uuid });
export const inscriptionParams = z.object({ id: uuid, apprenantId: uuid });

export type ListeClasses = z.infer<typeof listeClassesSchema>;
export type CreationClasse = z.infer<typeof creationClasseSchema>;
export type ModificationClasse = z.infer<typeof modificationClasseSchema>;
