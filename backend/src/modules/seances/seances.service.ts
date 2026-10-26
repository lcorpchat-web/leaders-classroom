import { env } from '../../config/env.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { conflit, HttpError, introuvable } from '../../utils/http-error.js';
import type { UtilisateurSession } from '../auth/auth.types.js';
import { verifierAccesClasse } from '../classes/acces.js';
import type { CreationSeance, ModificationSeance, Planning } from './seances.schemas.js';

type Client = Prisma.TransactionClient | typeof prisma;

const MINUTE = 60_000;
const DUREE_MAX_MS = 480 * MINUTE;
const OCCURRENCES_MAX = 52;

export const champsSeance = {
  id: true,
  titre: true,
  debut: true,
  dureeMinutes: true,
  statut: true,
  enregistree: true,
  classe: { select: { id: true, nom: true, image: true } },
  enseignant: { select: { id: true, nom: true, prenom: true, photo: true } },
} as const satisfies Prisma.SeanceSelect;

const formatHoraire = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: env.fuseauHoraire,
});

/** Séances visibles selon le rôle : toutes (admin), ses classes (enseignant), classes VALIDEE (apprenant, RG2). */
export function filtreSeancesVisibles(utilisateur: UtilisateurSession): Prisma.SeanceWhereInput {
  switch (utilisateur.role) {
    case 'ADMIN':
      return {};
    case 'ENSEIGNANT':
      return { classe: { affectations: { some: { enseignantId: utilisateur.id } } } };
    case 'APPRENANT':
      return { classe: { inscriptions: { some: { apprenantId: utilisateur.id, statut: 'VALIDEE' } } } };
  }
}

/** GET /api/moi/planning — séances commençant dans la période demandée. */
export function planning(utilisateur: UtilisateurSession, { debut, fin, classeId }: Planning) {
  return prisma.seance.findMany({
    where: { ...filtreSeancesVisibles(utilisateur), classeId, debut: { gte: debut, lt: fin } },
    select: champsSeance,
    orderBy: { debut: 'asc' },
  });
}

export async function obtenirSeance(utilisateur: UtilisateurSession, id: string) {
  const seance = await prisma.seance.findFirst({
    where: { id, ...filtreSeancesVisibles(utilisateur) },
    select: champsSeance,
  });
  if (!seance) throw introuvable('Séance introuvable');
  return seance;
}

/** RG4 : seul l'administration ou un enseignant affecté à la classe gère ses séances. */
const verifierDroitGestion = (utilisateur: UtilisateurSession, classeId: string, client: Client = prisma) =>
  verifierAccesClasse(utilisateur, classeId, 'gestion', client);

interface Creneau {
  debut: Date;
  fin: Date;
}

/**
 * Conflits d'horaire de l'enseignant et de la classe (diagramme d'activité, figure 9).
 * Deux créneaux se chevauchent si l'un commence avant la fin de l'autre.
 */
async function verifierConflits(
  client: Client,
  { classeId, enseignantId, creneaux, exclureId }: { classeId: string; enseignantId: string; creneaux: Creneau[]; exclureId?: string },
) {
  const min = Math.min(...creneaux.map((c) => c.debut.getTime())) - DUREE_MAX_MS;
  const max = Math.max(...creneaux.map((c) => c.fin.getTime()));

  const existantes = await client.seance.findMany({
    where: {
      id: exclureId ? { not: exclureId } : undefined,
      statut: { not: 'ANNULEE' },
      OR: [{ classeId }, { enseignantId }],
      debut: { gt: new Date(min), lt: new Date(max) },
    },
    select: { debut: true, dureeMinutes: true, classeId: true, titre: true },
  });

  for (const creneau of creneaux) {
    const chevauchement = existantes.find(
      (s) => s.debut < creneau.fin && s.debut.getTime() + s.dureeMinutes * MINUTE > creneau.debut.getTime(),
    );
    if (chevauchement) {
      const qui = chevauchement.classeId === classeId ? 'La classe' : 'L’enseignant';
      throw conflit(
        `${qui} a déjà une séance (« ${chevauchement.titre} ») le ${formatHoraire.format(chevauchement.debut)}`,
        'CONFLIT_HORAIRE',
      );
    }
  }
}

function verifierPeriodeClasse(classe: { dateDebut: Date; dateFin: Date | null }, creneaux: Creneau[]) {
  const finClasse = classe.dateFin ? classe.dateFin.getTime() + 24 * 3600 * 1000 : Infinity;
  const hors = creneaux.find((c) => c.debut < classe.dateDebut || c.debut.getTime() >= finClasse);
  if (hors) {
    throw new HttpError(400, `Le ${formatHoraire.format(hors.debut)} est hors de la période de la classe`, 'HORS_PERIODE');
  }
}

/** Occurrences hebdomadaires de la séance jusqu'à la date demandée (incluse). */
function genererCreneaux({ debut, dureeMinutes, repetition }: CreationSeance): Creneau[] {
  const creneaux: Creneau[] = [];
  const limite = repetition ? repetition.jusquAu.getTime() + 24 * 3600 * 1000 : debut.getTime() + 1;
  for (let t = debut.getTime(); t < limite && creneaux.length < OCCURRENCES_MAX; t += 7 * 24 * 3600 * 1000) {
    creneaux.push({ debut: new Date(t), fin: new Date(t + dureeMinutes * MINUTE) });
  }
  if (repetition && creneaux.length < 2) {
    throw new HttpError(400, 'La date de fin de répétition doit être au moins une semaine après la séance', 'REPETITION_INVALIDE');
  }
  return creneaux;
}

/** POST /api/classes/:id/seances — « Programmer une séance » (état PROGRAMMEE, figure 10). */
export async function programmerSeances(utilisateur: UtilisateurSession, classeId: string, donnees: CreationSeance) {
  if (donnees.debut.getTime() <= Date.now()) {
    throw new HttpError(400, 'La séance doit commencer dans le futur', 'DATE_PASSEE', [
      { champ: 'debut', message: 'La séance doit commencer dans le futur' },
    ]);
  }

  return prisma.$transaction(async (tx) => {
    const classe = await tx.classe.findUnique({
      where: { id: classeId },
      select: { active: true, dateDebut: true, dateFin: true, affectations: { select: { enseignantId: true } } },
    });
    if (!classe) throw introuvable('Classe introuvable');
    if (!classe.active) throw conflit('Impossible de programmer une séance dans une classe archivée', 'CLASSE_INACTIVE');
    await verifierDroitGestion(utilisateur, classeId, tx);

    // L'enseignant programme pour lui-même ; l'administration désigne un enseignant affecté
    const enseignantId = utilisateur.role === 'ENSEIGNANT' ? utilisateur.id : donnees.enseignantId;
    if (!enseignantId || !classe.affectations.some((a) => a.enseignantId === enseignantId)) {
      throw new HttpError(400, 'Choisissez un enseignant affecté à la classe', 'ENSEIGNANT_INVALIDE', [
        { champ: 'enseignantId', message: 'Choisissez un enseignant affecté à la classe' },
      ]);
    }

    const creneaux = genererCreneaux(donnees);
    verifierPeriodeClasse(classe, creneaux);
    await verifierConflits(tx, { classeId, enseignantId, creneaux });

    return tx.seance.createManyAndReturn({
      data: creneaux.map((c) => ({
        classeId,
        enseignantId,
        titre: donnees.titre,
        debut: c.debut,
        dureeMinutes: donnees.dureeMinutes,
      })),
      select: { id: true, titre: true, debut: true, dureeMinutes: true, statut: true },
    });
  });
}

/** Charge une séance gérable : droits RG4 et état PROGRAMMEE non commencé (figure 10, garde « début non atteint »). */
async function seanceModifiable(client: Client, utilisateur: UtilisateurSession, id: string) {
  const seance = await client.seance.findUnique({
    where: { id },
    select: {
      classeId: true,
      enseignantId: true,
      statut: true,
      debut: true,
      dureeMinutes: true,
      classe: { select: { dateDebut: true, dateFin: true } },
    },
  });
  if (!seance) throw introuvable('Séance introuvable');
  await verifierDroitGestion(utilisateur, seance.classeId, client);
  if (seance.statut !== 'PROGRAMMEE' || seance.debut.getTime() <= Date.now()) {
    throw conflit('Seule une séance programmée et pas encore commencée peut être modifiée ou annulée', 'SEANCE_FIGEE');
  }
  return seance;
}

/** PATCH /api/seances/:id — modifier titre, horaire ou durée */
export async function modifierSeance(utilisateur: UtilisateurSession, id: string, donnees: ModificationSeance) {
  return prisma.$transaction(async (tx) => {
    const seance = await seanceModifiable(tx, utilisateur, id);
    const debut = donnees.debut ?? seance.debut;
    const dureeMinutes = donnees.dureeMinutes ?? seance.dureeMinutes;

    if (donnees.debut || donnees.dureeMinutes) {
      if (debut.getTime() <= Date.now()) throw new HttpError(400, 'La séance doit commencer dans le futur', 'DATE_PASSEE');
      const creneaux = [{ debut, fin: new Date(debut.getTime() + dureeMinutes * MINUTE) }];
      verifierPeriodeClasse(seance.classe, creneaux);
      await verifierConflits(tx, { classeId: seance.classeId, enseignantId: seance.enseignantId, creneaux, exclureId: id });
    }

    return tx.seance.update({ where: { id }, data: donnees, select: champsSeance });
  });
}

/** POST /api/seances/:id/annuler — transition PROGRAMMEE → ANNULEE (figure 10) */
export async function annulerSeance(utilisateur: UtilisateurSession, id: string) {
  return prisma.$transaction(async (tx) => {
    await seanceModifiable(tx, utilisateur, id);
    return tx.seance.update({ where: { id }, data: { statut: 'ANNULEE' }, select: champsSeance });
  });
}
