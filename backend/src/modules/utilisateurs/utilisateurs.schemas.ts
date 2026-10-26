import { z } from 'zod';
import { Role } from '../../generated/prisma/client.js';
import { paginationSchema } from '../../utils/pagination.js';
import { booleenQuery, texteFacultatif } from '../../utils/schemas.js';

const email = z.string().trim().toLowerCase().pipe(z.email({ message: 'Adresse e-mail invalide' }));
const nomPropre = (libelle: string) => z.string().trim().min(1, `${libelle} requis`).max(100);

export const listeUtilisateursSchema = paginationSchema.extend({
  role: z.enum(Role).optional(),
  actif: booleenQuery.optional(),
  /** Recherche sur le nom, le prénom, l'e-mail ou le matricule */
  recherche: z.string().trim().max(100).optional(),
});

export const creationUtilisateurSchema = z.object({
  nom: nomPropre('Nom'),
  prenom: nomPropre('Prénom'),
  email,
  telephone: texteFacultatif(30),
  role: z.enum(Role, { message: 'Rôle invalide' }),
  /** Apprenant : généré automatiquement s'il n'est pas fourni */
  matricule: texteFacultatif(30),
  specialite: texteFacultatif(100),
});

/** Le rôle n'est pas modifiable : il conditionne les affectations, inscriptions et séances existantes. */
export const modificationUtilisateurSchema = z
  .object({
    nom: nomPropre('Nom'),
    prenom: nomPropre('Prénom'),
    email,
    telephone: texteFacultatif(30),
    matricule: texteFacultatif(30),
    specialite: texteFacultatif(100),
    actif: z.boolean(),
  })
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: 'Aucune modification fournie' });

export type CreationUtilisateur = z.infer<typeof creationUtilisateurSchema>;
export type ModificationUtilisateur = z.infer<typeof modificationUtilisateurSchema>;
export type ListeUtilisateurs = z.infer<typeof listeUtilisateursSchema>;
