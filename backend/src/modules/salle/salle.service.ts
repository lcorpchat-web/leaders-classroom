import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import {
  bbbSimulation,
  creerReunion,
  reunionEnCours,
  terminerReunion,
  urlRejoindre,
} from '../../lib/bigbluebutton.js';
import { prisma } from '../../lib/prisma.js';
import { conflit, HttpError, introuvable } from '../../utils/http-error.js';
import type { UtilisateurSession } from '../auth/auth.types.js';
import { cloturerPresences, fermerPresences, ouvrirPresence } from '../presences/presences.service.js';
import { champsSeance } from '../seances/seances.service.js';

const MINUTE = 60_000;
/** L'enseignant peut ouvrir la salle 15 minutes avant l'heure prévue */
const OUVERTURE_ANTICIPEE_MS = 15 * MINUTE;
/** Une séance restée ouverte est clôturée 30 minutes après sa fin prévue (marge de la réunion BBB) */
const MARGE_CLOTURE_MS = 30 * MINUTE;

const nomComplet = (u: UtilisateurSession) => `${u.prenom} ${u.nom}`;
const identifiantReunion = (seanceId: string) => `lc-${seanceId}`;

/** Jeton de l'URL de rappel de fin de séance : seul notre serveur peut le produire (section 12). */
export function jetonFinSeance(seanceId: string): string {
  return createHmac('sha256', env.jwtSecret).update(`fin-seance:${seanceId}`).digest('hex');
}

export function verifierJetonFinSeance(seanceId: string, jeton: string): boolean {
  const attendu = Buffer.from(jetonFinSeance(seanceId));
  const recu = Buffer.from(jeton);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}

async function chargerSeance(id: string) {
  const seance = await prisma.seance.findUnique({
    where: { id },
    select: {
      ...champsSeance,
      classeId: true,
      meetingIdBBB: true,
      classe: { select: { id: true, nom: true, affectations: { select: { enseignantId: true } } } },
    },
  });
  if (!seance) throw introuvable('Séance introuvable');
  return seance;
}

type SeanceChargee = Awaited<ReturnType<typeof chargerSeance>>;

const estAffecte = (seance: SeanceChargee, utilisateurId: string) =>
  seance.classe.affectations.some((a) => a.enseignantId === utilisateurId);

function finPrevue(seance: { debut: Date; dureeMinutes: number }) {
  return seance.debut.getTime() + seance.dureeMinutes * MINUTE;
}

function seanceSortie(seance: SeanceChargee) {
  const { classeId: _c, meetingIdBBB: _m, classe, ...reste } = seance;
  return { ...reste, classe: { id: classe.id, nom: classe.nom } };
}

/**
 * Démarrer une séance (figure 6) : enseignant affecté uniquement (RG4), séance PROGRAMMEE ou
 * EN_COURS (RG5). La réunion BBB n'est créée qu'au premier démarrage ; un second clic la réutilise.
 */
export async function demarrerSeance(utilisateur: UtilisateurSession, id: string) {
  const seance = await chargerSeance(id);
  if (utilisateur.role !== 'ENSEIGNANT' || !estAffecte(seance, utilisateur.id)) {
    throw new HttpError(403, 'Seul un enseignant affecté à la classe peut démarrer la séance', 'ACCES_REFUSE');
  }
  if (seance.statut === 'ANNULEE' || seance.statut === 'TERMINEE') {
    throw conflit('Cette séance est terminée ou annulée : elle ne peut plus être démarrée', 'SEANCE_CLOSE');
  }

  const maintenant = Date.now();
  if (seance.statut === 'PROGRAMMEE') {
    if (maintenant < seance.debut.getTime() - OUVERTURE_ANTICIPEE_MS) {
      throw conflit('La salle pourra être ouverte 15 minutes avant le début de la séance', 'TROP_TOT');
    }
    if (maintenant > finPrevue(seance)) throw conflit('Le créneau de cette séance est passé', 'CRENEAU_PASSE');
  }

  const meetingID = seance.meetingIdBBB ?? identifiantReunion(seance.id);
  await creerReunion({
    meetingID,
    nom: `${seance.classe.nom} — ${seance.titre}`,
    dureeMinutes: seance.dureeMinutes,
    logoutURL: `${env.appUrl}/seances/${seance.id}/salle?sortie=1`,
    endCallbackUrl: `${env.appUrl}/api/bbb/fin-seance?seanceId=${seance.id}&jeton=${jetonFinSeance(seance.id)}`,
  });

  await prisma.$transaction(async (tx) => {
    await tx.seance.update({ where: { id }, data: { statut: 'EN_COURS', meetingIdBBB: meetingID } });
    await ouvrirPresence(tx, id, utilisateur.id);
  });

  return {
    urlSalle: urlRejoindre({ meetingID, nomComplet: nomComplet(utilisateur), role: 'MODERATOR', userID: utilisateur.id }),
    simulation: bbbSimulation,
    seance: { ...seanceSortie(seance), statut: 'EN_COURS' as const },
  };
}

/**
 * Rejoindre une séance (figure 7) : apprenant inscrit (VALIDEE) ou enseignant affecté.
 * 403 si non autorisé, 409 si la séance n'a pas encore démarré (salle d'attente).
 */
export async function rejoindreSeance(utilisateur: UtilisateurSession, id: string) {
  const seance = await chargerSeance(id);
  const enseignant = utilisateur.role === 'ENSEIGNANT' && estAffecte(seance, utilisateur.id);
  const apprenant =
    utilisateur.role === 'APPRENANT' &&
    (await prisma.inscription.findFirst({
      where: { classeId: seance.classeId, apprenantId: utilisateur.id, statut: 'VALIDEE' },
    })) !== null;
  if (!enseignant && !apprenant) throw new HttpError(403, 'Vous n’êtes pas autorisé à rejoindre cette séance', 'ACCES_REFUSE');

  await cloturerSiDepassee(seance);
  if (seance.statut === 'ANNULEE') throw conflit('Cette séance a été annulée', 'SEANCE_ANNULEE');
  if (seance.statut === 'TERMINEE') throw conflit('Cette séance est terminée', 'SEANCE_TERMINEE');

  const meetingID = seance.meetingIdBBB;
  if (seance.statut !== 'EN_COURS' || !meetingID || !(await reunionEnCours(meetingID))) {
    throw conflit('La séance n’a pas encore commencé', 'SEANCE_NON_DEMARREE');
  }

  await ouvrirPresence(prisma, id, utilisateur.id);
  return {
    urlSalle: urlRejoindre({
      meetingID,
      nomComplet: nomComplet(utilisateur),
      role: enseignant ? 'MODERATOR' : 'VIEWER',
      userID: utilisateur.id,
    }),
    simulation: bbbSimulation,
    seance: seanceSortie(seance),
  };
}

/** Sortie de la salle (ajout) : ferme la présence ouverte pour un calcul de durée fiable. */
export async function quitterSeance(utilisateur: UtilisateurSession, id: string) {
  await fermerPresences(prisma, id, utilisateur.id);
}

/** Clôture idempotente : statut TERMINEE et calcul des présences (figure 8). */
export async function cloturerSeance(id: string) {
  await prisma.$transaction(async (tx) => {
    const seance = await tx.seance.findUnique({
      where: { id },
      select: { id: true, classeId: true, debut: true, dureeMinutes: true, statut: true },
    });
    if (!seance || seance.statut !== 'EN_COURS') return;
    await tx.seance.update({ where: { id }, data: { statut: 'TERMINEE' } });
    await cloturerPresences(tx, seance);
  });
}

async function cloturerSiDepassee(seance: SeanceChargee) {
  if (seance.statut === 'EN_COURS' && Date.now() > finPrevue(seance) + MARGE_CLOTURE_MS) {
    await cloturerSeance(seance.id);
    seance.statut = 'TERMINEE';
  }
}

/** Terminer la séance (enseignant affecté) : ferme la réunion BBB pour tous et clôture les présences. */
export async function terminerSeance(utilisateur: UtilisateurSession, id: string) {
  const seance = await chargerSeance(id);
  if (utilisateur.role !== 'ENSEIGNANT' || !estAffecte(seance, utilisateur.id)) {
    throw new HttpError(403, 'Seul un enseignant affecté à la classe peut terminer la séance', 'ACCES_REFUSE');
  }
  if (seance.statut !== 'EN_COURS') throw conflit('La séance n’est pas en cours', 'SEANCE_NON_DEMARREE');
  if (seance.meetingIdBBB) await terminerReunion(seance.meetingIdBBB);
  await cloturerSeance(id);
}

/** Tâche périodique : clôture les séances restées ouvertes après leur fin (rappel BBB perdu, simulation). */
export async function cloturerSeancesDepassees() {
  const ouvertes = await prisma.seance.findMany({
    where: { statut: 'EN_COURS' },
    select: { id: true, debut: true, dureeMinutes: true },
  });
  for (const s of ouvertes) {
    if (Date.now() > finPrevue(s) + MARGE_CLOTURE_MS) await cloturerSeance(s.id);
  }
}

export type EtatParticipant = 'EN_LIGNE' | 'PARTI' | 'NON_ARRIVE';

/**
 * Participants de la séance avec leur état en direct (panneau de la maquette 07) :
 * enseignants affectés et apprenants inscrits. Réservé aux membres de la classe et à l'administration.
 */
export async function participantsSeance(utilisateur: UtilisateurSession, id: string) {
  const seance = await chargerSeance(id);
  const autorise =
    utilisateur.role === 'ADMIN' ||
    estAffecte(seance, utilisateur.id) ||
    (utilisateur.role === 'APPRENANT' &&
      (await prisma.inscription.findFirst({
        where: { classeId: seance.classeId, apprenantId: utilisateur.id, statut: 'VALIDEE' },
      })) !== null);
  if (!autorise) throw introuvable('Séance introuvable');

  const [enseignants, inscrits, presences] = await Promise.all([
    prisma.utilisateur.findMany({
      where: { affectations: { some: { classeId: seance.classeId } } },
      select: { id: true, nom: true, prenom: true },
    }),
    prisma.utilisateur.findMany({
      where: { inscriptions: { some: { classeId: seance.classeId, statut: 'VALIDEE' } } },
      select: { id: true, nom: true, prenom: true },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
    }),
    prisma.presence.findMany({
      where: { seanceId: id },
      select: { utilisateurId: true, arrivee: true, depart: true, statut: true },
      orderBy: { arrivee: 'asc' },
    }),
  ]);

  const decrire = (p: { id: string; nom: string; prenom: string }, role: 'ENSEIGNANT' | 'APPRENANT') => {
    const entrees = presences.filter((e) => e.utilisateurId === p.id && e.arrivee);
    const etat: EtatParticipant = entrees.some((e) => !e.depart) ? 'EN_LIGNE' : entrees.length > 0 ? 'PARTI' : 'NON_ARRIVE';
    return {
      ...p,
      role,
      etat,
      arrivee: entrees[0]?.arrivee ?? null,
      statut: presences.find((e) => e.utilisateurId === p.id)?.statut ?? null,
    };
  };

  return {
    seance: seanceSortie(seance),
    participants: [...enseignants.map((e) => decrire(e, 'ENSEIGNANT')), ...inscrits.map((a) => decrire(a, 'APPRENANT'))],
  };
}
