import { z } from 'zod';
import { StatutPresence } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { conflit, introuvable } from '../../utils/http-error.js';
import { uuid } from '../../utils/schemas.js';
import type { UtilisateurSession } from '../auth/auth.types.js';
import { verifierAccesClasse } from '../classes/acces.js';

/** Consultation et correction des présences (cas « Consulter les présences », maquette 06). */

export const correctionsSchema = z.object({
  corrections: z
    .array(z.object({ apprenantId: uuid, statut: z.enum(StatutPresence) }))
    .min(1, 'Aucune correction')
    .max(500),
});

export const rapportSchema = z.object({ classeId: uuid });

interface EntreePresence {
  arrivee: Date | null;
  depart: Date | null;
  dureeMinutes: number;
  statut: StatutPresence | null;
}

/** Synthèse des entrées d'un participant : première arrivée, dernier départ, durée cumulée (RG6). */
function synthese(entrees: EntreePresence[]) {
  const avecArrivee = entrees.filter((e) => e.arrivee);
  const departs = avecArrivee.map((e) => e.depart).filter((d): d is Date => d !== null);
  return {
    statut: entrees[0]?.statut ?? null,
    arrivee: avecArrivee[0]?.arrivee ?? null,
    depart: departs.length > 0 ? new Date(Math.max(...departs.map((d) => d.getTime()))) : null,
    dureeMinutes: entrees.reduce((s, e) => s + e.dureeMinutes, 0),
    connexions: avecArrivee.length,
  };
}

/** GET /api/seances/:id/presences — feuille de présence (Enseignant affecté, Administrateur). */
export async function feuillePresence(utilisateur: UtilisateurSession, seanceId: string) {
  const seance = await prisma.seance.findUnique({
    where: { id: seanceId },
    select: {
      id: true,
      titre: true,
      debut: true,
      dureeMinutes: true,
      statut: true,
      classeId: true,
      classe: { select: { id: true, nom: true } },
    },
  });
  if (!seance) throw introuvable('Séance introuvable');
  await verifierAccesClasse(utilisateur, seance.classeId, 'gestion');

  const [inscrits, presences] = await Promise.all([
    prisma.utilisateur.findMany({
      where: { inscriptions: { some: { classeId: seance.classeId, statut: 'VALIDEE' } } },
      select: { id: true, nom: true, prenom: true, email: true, matricule: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    }),
    prisma.presence.findMany({
      where: { seanceId, utilisateur: { role: 'APPRENANT' } },
      select: {
        utilisateurId: true,
        arrivee: true,
        depart: true,
        dureeMinutes: true,
        statut: true,
        utilisateur: { select: { id: true, nom: true, prenom: true, email: true, matricule: true } },
      },
      orderBy: { arrivee: 'asc' },
    }),
  ]);

  // Inscrits actuels + anciens participants (retirés depuis) qui ont une présence
  const apprenants = new Map(inscrits.map((a) => [a.id, a]));
  for (const p of presences) if (!apprenants.has(p.utilisateurId)) apprenants.set(p.utilisateurId, p.utilisateur);

  const { classeId: _c, ...infos } = seance;
  return {
    seance: infos,
    lignes: [...apprenants.values()].map((apprenant) => ({
      apprenant,
      ...synthese(presences.filter((p) => p.utilisateurId === apprenant.id)),
    })),
  };
}

/**
 * PUT /api/seances/:id/presences — corrections de l'enseignant (« Enregistrer les présences »,
 * « Marquer tous présents »). Possible une fois la séance terminée, quand le statut a été calculé.
 */
export async function corrigerPresences(
  utilisateur: UtilisateurSession,
  seanceId: string,
  { corrections }: z.infer<typeof correctionsSchema>,
) {
  const seance = await prisma.seance.findUnique({ where: { id: seanceId }, select: { classeId: true, statut: true } });
  if (!seance) throw introuvable('Séance introuvable');
  await verifierAccesClasse(utilisateur, seance.classeId, 'gestion');
  if (seance.statut !== 'TERMINEE') {
    throw conflit('Les présences se corrigent une fois la séance terminée', 'SEANCE_NON_TERMINEE');
  }

  await prisma.$transaction(async (tx) => {
    for (const { apprenantId, statut } of corrections) {
      const { count } = await tx.presence.updateMany({ where: { seanceId, utilisateurId: apprenantId }, data: { statut } });
      if (count === 0) await tx.presence.create({ data: { seanceId, utilisateurId: apprenantId, statut } });
    }
  });
  return feuillePresence(utilisateur, seanceId);
}

function taux(present: number, retard: number, total: number) {
  return total === 0 ? null : Math.round(((present + retard) / total) * 100);
}

/** GET /api/moi/presences — historique de l'apprenant (« Les siennes », matrice des droits). */
export async function mesPresences(utilisateur: UtilisateurSession) {
  const seances = await prisma.seance.findMany({
    where: {
      statut: 'TERMINEE',
      OR: [
        { presences: { some: { utilisateurId: utilisateur.id } } },
        { classe: { inscriptions: { some: { apprenantId: utilisateur.id, statut: 'VALIDEE' } } } },
      ],
    },
    select: {
      id: true,
      titre: true,
      debut: true,
      dureeMinutes: true,
      classe: { select: { id: true, nom: true } },
      presences: {
        where: { utilisateurId: utilisateur.id },
        select: { arrivee: true, depart: true, dureeMinutes: true, statut: true },
        orderBy: { arrivee: 'asc' },
      },
    },
    orderBy: { debut: 'desc' },
    take: 200,
  });

  const historique = seances.map(({ presences, ...seance }) => {
    const s = synthese(presences);
    return { seance, ...s, statut: s.statut ?? ('ABSENT' as const) };
  });
  const compte = (statut: StatutPresence) => historique.filter((h) => h.statut === statut).length;
  const present = compte('PRESENT');
  const retard = compte('RETARD');

  return {
    resume: {
      seances: historique.length,
      present,
      retard,
      absent: compte('ABSENT'),
      taux: taux(present, retard, historique.length),
    },
    historique,
  };
}

/** GET /api/presences/rapport?classeId= — synthèse par apprenant sur les séances terminées de la classe. */
export async function rapportClasse(utilisateur: UtilisateurSession, classeId: string) {
  await verifierAccesClasse(utilisateur, classeId, 'gestion');

  const [inscrits, nbSeances, presences] = await Promise.all([
    prisma.utilisateur.findMany({
      where: { inscriptions: { some: { classeId, statut: 'VALIDEE' } } },
      select: { id: true, nom: true, prenom: true, email: true, matricule: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    }),
    prisma.seance.count({ where: { classeId, statut: 'TERMINEE' } }),
    prisma.presence.findMany({
      where: { seance: { classeId, statut: 'TERMINEE' }, utilisateur: { role: 'APPRENANT' } },
      select: { utilisateurId: true, seanceId: true, statut: true },
    }),
  ]);

  const lignes = inscrits.map((apprenant) => {
    // Un statut par séance (les reconnexions partagent le même statut)
    const parSeance = new Map(presences.filter((p) => p.utilisateurId === apprenant.id).map((p) => [p.seanceId, p.statut]));
    const statuts = [...parSeance.values()];
    const present = statuts.filter((s) => s === 'PRESENT').length;
    const retard = statuts.filter((s) => s === 'RETARD').length;
    return { apprenant, present, retard, absent: nbSeances - present - retard, taux: taux(present, retard, nbSeances) };
  });

  const totalPresents = lignes.reduce((s, l) => s + l.present + l.retard, 0);
  return {
    seancesTerminees: nbSeances,
    tauxMoyen: nbSeances && lignes.length ? Math.round((totalPresents / (nbSeances * lignes.length)) * 100) : null,
    lignes,
  };
}
