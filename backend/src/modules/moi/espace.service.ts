import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { uuid } from '../../utils/schemas.js';
import type { UtilisateurSession } from '../auth/auth.types.js';

/** Recherche globale, « Mes étudiants » et « Mes documents » (barre du haut et menu des maquettes). */

const contient = (texte: string) => ({ contains: texte, mode: 'insensitive' as const });

/** Classes accessibles selon le rôle */
function classesAccessibles(u: UtilisateurSession): Prisma.ClasseWhereInput {
  if (u.role === 'ADMIN') return {};
  if (u.role === 'ENSEIGNANT') return { affectations: { some: { enseignantId: u.id } } };
  return { inscriptions: { some: { apprenantId: u.id, statut: 'VALIDEE' } } };
}

export const rechercheSchema = z.object({ q: z.string().trim().min(2, '2 caractères minimum').max(100) });

/** GET /api/recherche?q= — « Rechercher une classe, un étudiant, un document… » */
export async function rechercher(u: UtilisateurSession, q: string) {
  const classes = classesAccessibles(u);
  const [listeClasses, apprenants, documents] = await Promise.all([
    prisma.classe.findMany({
      where: { ...classes, nom: contient(q) },
      select: { id: true, nom: true, image: true, active: true },
      orderBy: { nom: 'asc' },
      take: 5,
    }),
    u.role === 'APPRENANT'
      ? Promise.resolve([])
      : prisma.utilisateur.findMany({
          where: {
            role: 'APPRENANT',
            ...(u.role === 'ENSEIGNANT' && { inscriptions: { some: { statut: 'VALIDEE', classe: classes } } }),
            OR: [{ nom: contient(q) }, { prenom: contient(q) }, { email: contient(q) }, { matricule: contient(q) }],
          },
          select: { id: true, nom: true, prenom: true, email: true, matricule: true, photo: true },
          orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
          take: 5,
        }),
    prisma.support.findMany({
      where: { classe: classes, OR: [{ titre: contient(q) }, { nomFichier: contient(q) }] },
      select: { id: true, titre: true, nomFichier: true, typeMime: true, classe: { select: { id: true, nom: true } } },
      orderBy: { deposeLe: 'desc' },
      take: 5,
    }),
  ]);
  return { classes: listeClasses, apprenants, documents };
}

export const etudiantsSchema = z.object({
  classeId: uuid.optional(),
  recherche: z.string().trim().max(100).optional(),
});

/** GET /api/moi/etudiants — apprenants inscrits dans mes classes (tous pour l'administration) */
export async function mesEtudiants(u: UtilisateurSession, { classeId, recherche }: z.infer<typeof etudiantsSchema>) {
  const classes: Prisma.ClasseWhereInput = { ...classesAccessibles(u), ...(classeId && { id: classeId }) };
  const apprenants = await prisma.utilisateur.findMany({
    where: {
      role: 'APPRENANT',
      inscriptions: { some: { statut: 'VALIDEE', classe: classes } },
      ...(recherche && {
        OR: [{ nom: contient(recherche) }, { prenom: contient(recherche) }, { email: contient(recherche) }, { matricule: contient(recherche) }],
      }),
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      matricule: true,
      photo: true,
      actif: true,
      inscriptions: {
        where: { statut: 'VALIDEE', classe: classes },
        select: { classe: { select: { id: true, nom: true } } },
      },
      presences: {
        where: { seance: { statut: 'TERMINEE', classe: classes } },
        select: { seanceId: true, statut: true },
      },
    },
    orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    take: 500,
  });

  return apprenants.map(({ inscriptions, presences, ...a }) => {
    const statuts = [...new Map(presences.map((p) => [p.seanceId, p.statut])).values()];
    const presents = statuts.filter((s) => s === 'PRESENT' || s === 'RETARD').length;
    return {
      ...a,
      classes: inscriptions.map((i) => i.classe),
      tauxPresence: statuts.length === 0 ? null : Math.round((presents / statuts.length) * 100),
    };
  });
}

export const documentsSchema = z.object({
  classeId: uuid.optional(),
  recherche: z.string().trim().max(100).optional(),
});

/** GET /api/moi/documents — tous les supports de mes classes */
export function mesDocuments(u: UtilisateurSession, { classeId, recherche }: z.infer<typeof documentsSchema>) {
  return prisma.support.findMany({
    where: {
      classe: { ...classesAccessibles(u), ...(classeId && { id: classeId }) },
      ...(recherche && { OR: [{ titre: contient(recherche) }, { nomFichier: contient(recherche) }] }),
    },
    select: {
      id: true,
      titre: true,
      nomFichier: true,
      typeMime: true,
      tailleOctets: true,
      deposeLe: true,
      classe: { select: { id: true, nom: true } },
      seance: { select: { id: true, titre: true, debut: true } },
      deposePar: { select: { id: true, nom: true, prenom: true } },
    },
    orderBy: { deposeLe: 'desc' },
    take: 500,
  });
}

/** GET /api/moi/cours — « Mes cours » : classes actives avec progression (séances terminées / prévues) */
export async function mesCours(u: UtilisateurSession) {
  const classes = await prisma.classe.findMany({
    where: { ...classesAccessibles(u), active: true },
    select: {
      id: true,
      nom: true,
      description: true,
      image: true,
      categorie: true,
      niveau: true,
      affectations: { select: { enseignant: { select: { id: true, prenom: true, nom: true, photo: true } } } },
      seances: { where: { statut: { not: 'ANNULEE' } }, select: { id: true, titre: true, debut: true, statut: true }, orderBy: { debut: 'asc' } },
      _count: { select: { supports: true, inscriptions: { where: { statut: 'VALIDEE' } } } },
    },
    orderBy: { nom: 'asc' },
  });
  const maintenant = Date.now();
  return classes.map(({ affectations, seances, _count, ...c }) => ({
    ...c,
    enseignants: affectations.map((a) => a.enseignant),
    nbApprenants: _count.inscriptions,
    nbSupports: _count.supports,
    nbSeances: seances.length,
    progression: seances.length === 0 ? 0 : Math.round((seances.filter((s) => s.statut === 'TERMINEE').length / seances.length) * 100),
    prochaineSeance: seances.find((s) => s.statut === 'PROGRAMMEE' && s.debut.getTime() >= maintenant) ?? null,
  }));
}
