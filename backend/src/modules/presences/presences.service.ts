import { env } from '../../config/env.js';
import type { Prisma, StatutPresence } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';

type Client = Prisma.TransactionClient | typeof prisma;

const MINUTE = 60_000;

/**
 * RG6 : une présence est créée à chaque entrée dans la salle. Si l'utilisateur a déjà une
 * présence ouverte (rechargement de la page), elle est réutilisée.
 */
export async function ouvrirPresence(client: Client, seanceId: string, utilisateurId: string) {
  const ouverte = await client.presence.findFirst({
    where: { seanceId, utilisateurId, depart: null, arrivee: { not: null } },
  });
  return ouverte ?? client.presence.create({ data: { seanceId, utilisateurId, arrivee: new Date() } });
}

/** Ferme les présences ouvertes (sortie de la salle ou fin de séance) et calcule leur durée. */
export async function fermerPresences(client: Client, seanceId: string, utilisateurId?: string, instant = new Date()) {
  const ouvertes = await client.presence.findMany({
    where: { seanceId, utilisateurId, depart: null, arrivee: { not: null } },
    select: { id: true, arrivee: true },
  });
  for (const p of ouvertes) {
    await client.presence.update({
      where: { id: p.id },
      data: { depart: instant, dureeMinutes: Math.max(0, Math.round((instant.getTime() - p.arrivee!.getTime()) / MINUTE)) },
    });
  }
}

/**
 * Statut d'un participant à la clôture (RG6, seuils réglables dans .env) :
 * ABSENT sans entrée ou si la durée cumulée est trop courte, RETARD si la première arrivée
 * dépasse le délai toléré, PRESENT sinon. Les reconnexions cumulent la durée.
 */
export function calculerStatut(
  seance: { debut: Date; dureeMinutes: number },
  entrees: Array<{ arrivee: Date | null; dureeMinutes: number }>,
): StatutPresence {
  const arrivees = entrees.map((e) => e.arrivee).filter((a): a is Date => a !== null);
  if (arrivees.length === 0) return 'ABSENT';

  const total = entrees.reduce((somme, e) => somme + e.dureeMinutes, 0);
  if (total * 100 < seance.dureeMinutes * env.presence.dureeMinPourcent) return 'ABSENT';

  const premiere = Math.min(...arrivees.map((a) => a.getTime()));
  if (premiere > seance.debut.getTime() + env.presence.retardMinutes * MINUTE) return 'RETARD';
  return 'PRESENT';
}

/**
 * Clôture des présences (figure 8) : ferme les présences ouvertes, calcule le statut de chacun,
 * puis crée une présence ABSENT pour chaque apprenant inscrit qui n'est jamais entré.
 */
export async function cloturerPresences(
  client: Client,
  seance: { id: string; classeId: string; debut: Date; dureeMinutes: number },
  instant = new Date(),
) {
  await fermerPresences(client, seance.id, undefined, instant);

  const presences = await client.presence.findMany({
    where: { seanceId: seance.id },
    select: { utilisateurId: true, arrivee: true, dureeMinutes: true },
  });

  const parUtilisateur = new Map<string, typeof presences>();
  for (const p of presences) parUtilisateur.set(p.utilisateurId, [...(parUtilisateur.get(p.utilisateurId) ?? []), p]);

  for (const [utilisateurId, entrees] of parUtilisateur) {
    await client.presence.updateMany({
      where: { seanceId: seance.id, utilisateurId },
      data: { statut: calculerStatut(seance, entrees) },
    });
  }

  const absents = await client.inscription.findMany({
    where: { classeId: seance.classeId, statut: 'VALIDEE', apprenantId: { notIn: [...parUtilisateur.keys()] } },
    select: { apprenantId: true },
  });
  if (absents.length > 0) {
    await client.presence.createMany({
      data: absents.map((a) => ({ seanceId: seance.id, utilisateurId: a.apprenantId, statut: 'ABSENT' as const })),
    });
  }
}
