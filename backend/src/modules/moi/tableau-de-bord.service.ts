import { z } from 'zod';
import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import type { UtilisateurSession } from '../auth/auth.types.js';
import { mesPresences } from '../presences/presences.feuilles.js';
import { champsSeance, filtreSeancesVisibles } from '../seances/seances.service.js';
import { derniersSupports } from '../supports/supports.service.js';

const JOUR_MS = 24 * 3600 * 1000;

export const tableauDeBordSchema = z.object({
  /** Filtre « Cette semaine / Ce mois / Ce semestre » de la maquette 03 */
  periode: z.enum(['semaine', 'mois', 'semestre']).default('semaine'),
});

type Periode = z.infer<typeof tableauDeBordSchema>['periode'];

interface Intervalle {
  debut: Date;
  fin: Date;
}

/** Période courante et période précédente de même durée (pour l'évolution en %) */
function intervalles(periode: Periode): { courante: Intervalle; precedente: Intervalle } {
  const m = new Date();
  let debut: Date;
  let fin: Date;
  if (periode === 'semaine') {
    debut = new Date(m.getFullYear(), m.getMonth(), m.getDate() - ((m.getDay() + 6) % 7));
    fin = new Date(debut.getTime() + 7 * JOUR_MS);
  } else if (periode === 'mois') {
    debut = new Date(m.getFullYear(), m.getMonth(), 1);
    fin = new Date(m.getFullYear(), m.getMonth() + 1, 1);
  } else {
    const premierMois = m.getMonth() < 6 ? 0 : 6;
    debut = new Date(m.getFullYear(), premierMois, 1);
    fin = new Date(m.getFullYear(), premierMois + 6, 1);
  }
  const duree = fin.getTime() - debut.getTime();
  return { courante: { debut, fin }, precedente: { debut: new Date(debut.getTime() - duree), fin: debut } };
}

const dans = ({ debut, fin }: Intervalle) => ({ gte: debut, lt: fin });

/** Évolution en % par rapport à la période précédente (null si rien à comparer) */
const evolution = (actuel: number, precedent: number) =>
  precedent === 0 ? null : Math.round(((actuel - precedent) / precedent) * 100);

/** Répartition des statuts de présence (un statut par apprenant et par séance) */
async function repartitionPresences(seances: Prisma.SeanceWhereInput) {
  const lignes = await prisma.presence.findMany({
    where: { seance: { ...seances, statut: 'TERMINEE' }, utilisateur: { role: 'APPRENANT' } },
    select: { seanceId: true, utilisateurId: true, statut: true },
  });
  const statuts = [...new Map(lignes.map((l) => [`${l.seanceId}:${l.utilisateurId}`, l.statut])).values()];
  const present = statuts.filter((s) => s === 'PRESENT').length;
  const retard = statuts.filter((s) => s === 'RETARD').length;
  const absent = statuts.filter((s) => s === 'ABSENT').length;
  const total = present + retard + absent;
  return { present, retard, absent, taux: total === 0 ? null : Math.round(((present + retard) / total) * 100) };
}

/** Statistiques de la période (maquette 03 : « Statistiques de mes classes ») */
async function statistiques(classes: Prisma.ClasseWhereInput, periode: Periode) {
  const { courante, precedente } = intervalles(periode);
  const seancesDe = (i: Intervalle) => ({ classe: classes, debut: dans(i) });

  const [apprenants, nouveaux, presences, presencesAvant, realisees, realiseesAvant, documents, documentsAvant] =
    await Promise.all([
      prisma.utilisateur.count({ where: { inscriptions: { some: { statut: 'VALIDEE', classe: { ...classes, active: true } } } } }),
      prisma.inscription.count({ where: { statut: 'VALIDEE', classe: { ...classes, active: true }, dateInscription: dans(courante) } }),
      repartitionPresences(seancesDe(courante)),
      repartitionPresences(seancesDe(precedente)),
      prisma.seance.count({ where: { ...seancesDe(courante), statut: 'TERMINEE' } }),
      prisma.seance.count({ where: { ...seancesDe(precedente), statut: 'TERMINEE' } }),
      prisma.support.count({ where: { classe: classes, deposeLe: dans(courante) } }),
      prisma.support.count({ where: { classe: classes, deposeLe: dans(precedente) } }),
    ]);

  return {
    periode,
    apprenants: { valeur: apprenants, evolution: evolution(apprenants, apprenants - nouveaux) },
    tauxPresence: {
      valeur: presences.taux,
      // En points de pourcentage
      evolution: presences.taux !== null && presencesAvant.taux !== null ? presences.taux - presencesAvant.taux : null,
    },
    seancesRealisees: { valeur: realisees, evolution: evolution(realisees, realiseesAvant) },
    documents: { valeur: documents, evolution: evolution(documents, documentsAvant) },
    presences,
  };
}

/** Taux de présence de chaque classe sur ses séances terminées (« Mes classes », maquette 03) */
async function classesAvecTaux(classes: Prisma.ClasseWhereInput) {
  const liste = await prisma.classe.findMany({
    where: { ...classes, active: true },
    select: {
      id: true,
      nom: true,
      image: true,
      capaciteMax: true,
      _count: { select: { inscriptions: { where: { statut: 'VALIDEE' } } } },
    },
    orderBy: { nom: 'asc' },
  });
  return Promise.all(
    liste.map(async ({ _count, ...c }) => ({
      ...c,
      nbApprenants: _count.inscriptions,
      tauxPresence: (await repartitionPresences({ classeId: c.id })).taux,
    })),
  );
}

export type Activite = {
  type: 'DOCUMENT' | 'SEANCE_TERMINEE' | 'INSCRIPTION' | 'SEANCE_PROGRAMMEE';
  titre: string;
  detail: string;
  date: Date;
};

/** « Activités récentes » : documents partagés, séances terminées, nouveaux inscrits */
async function activitesRecentes(classes: Prisma.ClasseWhereInput, nombre = 8): Promise<Activite[]> {
  const [supports, seances, inscriptions] = await Promise.all([
    prisma.support.findMany({
      where: { classe: classes },
      select: { titre: true, nomFichier: true, deposeLe: true, classe: { select: { nom: true } } },
      orderBy: { deposeLe: 'desc' },
      take: nombre,
    }),
    prisma.seance.findMany({
      where: { classe: classes, statut: 'TERMINEE' },
      select: { titre: true, debut: true, dureeMinutes: true, classe: { select: { nom: true } } },
      orderBy: { debut: 'desc' },
      take: nombre,
    }),
    prisma.inscription.findMany({
      where: { classe: classes, statut: 'VALIDEE' },
      select: { dateInscription: true, apprenant: { select: { prenom: true, nom: true } }, classe: { select: { nom: true } } },
      orderBy: { dateInscription: 'desc' },
      take: nombre,
    }),
  ]);

  return [
    ...supports.map((s) => ({ type: 'DOCUMENT' as const, titre: 'Document partagé', detail: `${s.nomFichier} — ${s.classe.nom}`, date: s.deposeLe })),
    ...seances.map((s) => ({
      type: 'SEANCE_TERMINEE' as const,
      titre: 'Séance terminée',
      detail: `${s.titre} — ${s.classe.nom}`,
      date: new Date(s.debut.getTime() + s.dureeMinutes * 60_000),
    })),
    ...inscriptions.map((i) => ({
      type: 'INSCRIPTION' as const,
      titre: 'Nouvel apprenant inscrit',
      detail: `${i.apprenant.prenom} ${i.apprenant.nom} — ${i.classe.nom}`,
      date: i.dateInscription,
    })),
  ]
    .filter((a) => a.date.getTime() <= Date.now())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, nombre);
}

/** Progression des cours de l'apprenant : séances terminées / séances prévues (« Mes cours », maquette 02) */
async function coursApprenant(apprenantId: string) {
  const classes = await prisma.classe.findMany({
    where: { active: true, inscriptions: { some: { apprenantId, statut: 'VALIDEE' } } },
    select: {
      id: true,
      nom: true,
      image: true,
      affectations: { select: { enseignant: { select: { id: true, prenom: true, nom: true } } }, take: 1 },
      seances: { where: { statut: { not: 'ANNULEE' } }, select: { statut: true } },
    },
    orderBy: { nom: 'asc' },
  });
  return classes.map(({ affectations, seances, ...c }) => ({
    ...c,
    enseignant: affectations[0]?.enseignant ?? null,
    progression: seances.length === 0 ? 0 : Math.round((seances.filter((s) => s.statut === 'TERMINEE').length / seances.length) * 100),
  }));
}

/**
 * GET /api/moi/tableau-de-bord?periode= — données des maquettes 02 (apprenant) et 03 (enseignant),
 * et vue d'ensemble pour l'administration.
 */
export async function tableauDeBord(utilisateur: UtilisateurSession, periode: Periode) {
  const visibles = filtreSeancesVisibles(utilisateur);
  const semaine = intervalles('semaine').courante;

  const [enCours, prochaines, cetteSemaine] = await Promise.all([
    prisma.seance.findMany({ where: { ...visibles, statut: 'EN_COURS' }, select: champsSeance, orderBy: { debut: 'asc' } }),
    prisma.seance.findMany({
      where: { ...visibles, statut: 'PROGRAMMEE', debut: { gte: new Date() } },
      select: champsSeance,
      orderBy: { debut: 'asc' },
      take: 5,
    }),
    prisma.seance.count({ where: { ...visibles, statut: { not: 'ANNULEE' }, debut: dans(semaine) } }),
  ]);

  // Effectif de chaque classe affichée (« 28 étudiants » dans la liste des séances)
  const classeIds = [...new Set([...enCours, ...prochaines].map((s) => s.classe.id))];
  const effectifs = Object.fromEntries(
    (
      await prisma.inscription.groupBy({ by: ['classeId'], where: { classeId: { in: classeIds }, statut: 'VALIDEE' }, _count: true })
    ).map((g) => [g.classeId, g._count]),
  );
  const seances = { enCours, prochaines, cetteSemaine, effectifs };

  if (utilisateur.role === 'APPRENANT') {
    const mesClasses = { inscriptions: { some: { apprenantId: utilisateur.id, statut: 'VALIDEE' } } } satisfies Prisma.ClasseWhereInput;
    const [cours, presences, supports, nbSupports] = await Promise.all([
      coursApprenant(utilisateur.id),
      mesPresences(utilisateur),
      derniersSupports({ classe: mesClasses }),
      prisma.support.count({ where: { classe: mesClasses } }),
    ]);
    return {
      role: utilisateur.role,
      seances,
      indicateurs: { classes: cours.length, seancesSemaine: cetteSemaine, tauxPresence: presences.resume.taux, documents: nbSupports },
      cours,
      supports,
    };
  }

  const perimetre: Prisma.ClasseWhereInput =
    utilisateur.role === 'ENSEIGNANT' ? { affectations: { some: { enseignantId: utilisateur.id } } } : {};

  const [stats, classes, activites] = await Promise.all([
    statistiques(perimetre, periode),
    classesAvecTaux(perimetre),
    activitesRecentes(perimetre),
  ]);
  const tauxGlobal = (await repartitionPresences({ classe: perimetre })).taux;

  if (utilisateur.role === 'ENSEIGNANT') {
    return {
      role: utilisateur.role,
      seances,
      indicateurs: { classes: classes.length, apprenants: stats.apprenants.valeur, seancesSemaine: cetteSemaine, tauxPresence: tauxGlobal },
      statistiques: stats,
      classes,
      activites,
      supports: await derniersSupports({ classe: perimetre }),
    };
  }

  const comptes = await prisma.utilisateur.groupBy({ by: ['role'], where: { actif: true }, _count: true });
  const parRole = Object.fromEntries(comptes.map((c) => [c.role, c._count]));
  return {
    role: utilisateur.role,
    seances,
    indicateurs: {
      apprenants: parRole.APPRENANT ?? 0,
      enseignants: parRole.ENSEIGNANT ?? 0,
      classes: classes.length,
      tauxPresence: tauxGlobal,
    },
    statistiques: stats,
    classes,
    activites,
  };
}
