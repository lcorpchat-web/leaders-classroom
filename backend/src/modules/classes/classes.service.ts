import type { Prisma, StatutInscription } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { conflit, HttpError, introuvable } from '../../utils/http-error.js';
import { skipTake, type Page } from '../../utils/pagination.js';
import type { UtilisateurSession } from '../auth/auth.types.js';
import type { CreationClasse, ListeClasses, ModificationClasse } from './classes.schemas.js';

type Client = Prisma.TransactionClient | typeof prisma;

const personne = { id: true, nom: true, prenom: true, email: true, photo: true } as const;

const champsClasse = {
  id: true,
  nom: true,
  description: true,
  dateDebut: true,
  dateFin: true,
  capaciteMax: true,
  image: true,
  categorie: true,
  niveau: true,
  langue: true,
  active: true,
  creeLe: true,
  affectations: { select: { enseignant: { select: personne } }, orderBy: { affecteLe: 'asc' } },
  _count: { select: { inscriptions: { where: { statut: 'VALIDEE' } } } },
} as const satisfies Prisma.ClasseSelect;

type ClasseBrute = Prisma.ClasseGetPayload<{ select: typeof champsClasse }>;

function formaterClasse({ affectations, _count, ...classe }: ClasseBrute) {
  return {
    ...classe,
    enseignants: affectations.map((a) => a.enseignant),
    nbApprenants: _count.inscriptions,
  };
}

export type ClasseResume = ReturnType<typeof formaterClasse>;

/**
 * Classes visibles selon le rôle (matrice des droits) :
 * administrateur → toutes ; enseignant → ses classes ; apprenant → classes où son inscription est VALIDEE (RG2).
 */
function filtreVisibilite(utilisateur: UtilisateurSession): Prisma.ClasseWhereInput {
  switch (utilisateur.role) {
    case 'ADMIN':
      return {};
    case 'ENSEIGNANT':
      return { affectations: { some: { enseignantId: utilisateur.id } } };
    case 'APPRENANT':
      return { inscriptions: { some: { apprenantId: utilisateur.id, statut: 'VALIDEE' } } };
  }
}

export async function listerClasses(utilisateur: UtilisateurSession, filtres: ListeClasses): Promise<Page<ClasseResume>> {
  const where: Prisma.ClasseWhereInput = {
    ...filtreVisibilite(utilisateur),
    active: filtres.active,
    ...(filtres.recherche && { nom: { contains: filtres.recherche, mode: 'insensitive' } }),
  };

  const [classes, total] = await prisma.$transaction([
    prisma.classe.findMany({
      where,
      select: champsClasse,
      orderBy: [{ active: 'desc' }, { dateDebut: 'desc' }, { nom: 'asc' }],
      ...skipTake(filtres),
    }),
    prisma.classe.count({ where }),
  ]);

  return { donnees: classes.map(formaterClasse), total, page: filtres.page, parPage: filtres.parPage };
}

/** Détail d'une classe ; la liste des inscrits est réservée à l'administration et aux enseignants affectés. */
export async function obtenirClasse(utilisateur: UtilisateurSession, id: string) {
  const classe = await prisma.classe.findFirst({
    where: { id, ...filtreVisibilite(utilisateur) },
    select: champsClasse,
  });
  if (!classe) throw introuvable('Classe introuvable');

  const inscriptions =
    utilisateur.role === 'APPRENANT'
      ? []
      : await prisma.inscription.findMany({
          where: { classeId: id, ...(utilisateur.role === 'ENSEIGNANT' && { statut: 'VALIDEE' }) },
          select: {
            statut: true,
            dateInscription: true,
            apprenant: { select: { ...personne, matricule: true, actif: true } },
          },
          orderBy: [{ apprenant: { nom: 'asc' } }, { apprenant: { prenom: 'asc' } }],
        });

  return { ...formaterClasse(classe), inscriptions };
}

async function verifierUtilisateurs(ids: string[], role: 'ENSEIGNANT' | 'APPRENANT', client: Client = prisma) {
  const trouves = await client.utilisateur.count({ where: { id: { in: ids }, role, actif: true } });
  if (trouves !== new Set(ids).size) {
    const libelle = role === 'ENSEIGNANT' ? 'enseignant' : 'apprenant';
    throw new HttpError(400, `Compte ${libelle} introuvable ou désactivé`, 'UTILISATEUR_INVALIDE');
  }
}

export async function creerClasse({ enseignantIds, ...donnees }: CreationClasse) {
  await verifierUtilisateurs(enseignantIds, 'ENSEIGNANT');
  const classe = await prisma.classe.create({
    data: {
      ...donnees,
      affectations: { create: [...new Set(enseignantIds)].map((enseignantId) => ({ enseignantId })) },
    },
    select: champsClasse,
  });
  return formaterClasse(classe);
}

export async function modifierClasse(id: string, donnees: ModificationClasse) {
  const existante = await prisma.classe.findUnique({
    where: { id },
    select: { dateDebut: true, dateFin: true, _count: { select: { inscriptions: { where: { statut: 'VALIDEE' } } } } },
  });
  if (!existante) throw introuvable('Classe introuvable');

  const dateDebut = donnees.dateDebut ?? existante.dateDebut;
  const dateFin = donnees.dateFin === undefined ? existante.dateFin : donnees.dateFin;
  if (dateFin && dateFin < dateDebut) {
    throw new HttpError(400, 'La date de fin doit suivre la date de début', 'DATES_INCOHERENTES', [
      { champ: 'dateFin', message: 'La date de fin doit suivre la date de début' },
    ]);
  }
  if (donnees.capaciteMax && donnees.capaciteMax < existante._count.inscriptions) {
    throw conflit(
      `La classe compte déjà ${existante._count.inscriptions} apprenants inscrits : capacité insuffisante`,
      'CAPACITE_INSUFFISANTE',
    );
  }

  return formaterClasse(await prisma.classe.update({ where: { id }, data: donnees, select: champsClasse }));
}

async function verifierClasseExiste(id: string, client: Client = prisma) {
  const classe = await client.classe.findUnique({ where: { id }, select: { active: true, capaciteMax: true } });
  if (!classe) throw introuvable('Classe introuvable');
  return classe;
}

// --- Affectations (Administrateur) -------------------------------------------------------------

export async function affecterEnseignant(classeId: string, enseignantId: string) {
  await verifierClasseExiste(classeId);
  await verifierUtilisateurs([enseignantId], 'ENSEIGNANT');
  const deja = await prisma.affectation.findUnique({ where: { classeId_enseignantId: { classeId, enseignantId } } });
  if (deja) throw conflit('Cet enseignant est déjà affecté à la classe', 'DEJA_AFFECTE');
  await prisma.affectation.create({ data: { classeId, enseignantId } });
}

/** Ajout à la section 11. RG1 : impossible de retirer le dernier enseignant d'une classe. */
export async function retirerEnseignant(classeId: string, enseignantId: string) {
  await prisma.$transaction(async (tx) => {
    const affectations = await tx.affectation.findMany({ where: { classeId }, select: { enseignantId: true } });
    if (!affectations.some((a) => a.enseignantId === enseignantId)) {
      throw introuvable('Cet enseignant n’est pas affecté à la classe');
    }
    if (affectations.length === 1) {
      throw conflit('Une classe doit garder au moins un enseignant', 'DERNIER_ENSEIGNANT');
    }
    await tx.affectation.delete({ where: { classeId_enseignantId: { classeId, enseignantId } } });
  });
}

// --- Inscriptions (Administrateur) -------------------------------------------------------------

async function verifierPlaceDisponible(tx: Client, classeId: string, capaciteMax: number | null) {
  if (capaciteMax === null) return;
  const inscrits = await tx.inscription.count({ where: { classeId, statut: 'VALIDEE' } });
  if (inscrits >= capaciteMax) throw conflit('La classe est complète', 'CLASSE_COMPLETE');
}

/**
 * Inscription par l'administration : elle vaut validation administrative (note de la figure 11),
 * l'inscription est donc directement VALIDEE. Une inscription RETIREE est réactivée (réinscrire).
 */
export async function inscrireApprenant(classeId: string, apprenantId: string) {
  return prisma.$transaction(async (tx) => {
    const classe = await verifierClasseExiste(classeId, tx);
    if (!classe.active) throw conflit('Impossible d’inscrire dans une classe archivée', 'CLASSE_INACTIVE');
    await verifierUtilisateurs([apprenantId], 'APPRENANT', tx);

    const existante = await tx.inscription.findUnique({
      where: { classeId_apprenantId: { classeId, apprenantId } },
    });
    if (existante?.statut === 'VALIDEE') throw conflit('Cet apprenant est déjà inscrit', 'DEJA_INSCRIT');

    await verifierPlaceDisponible(tx, classeId, classe.capaciteMax);
    return tx.inscription.upsert({
      where: { classeId_apprenantId: { classeId, apprenantId } },
      create: { classeId, apprenantId, statut: 'VALIDEE' },
      update: { statut: 'VALIDEE' },
    });
  });
}

/** Transitions autorisées (figure 11) */
const transitions: Record<StatutInscription, StatutInscription[]> = {
  EN_ATTENTE: ['VALIDEE', 'RETIREE'],
  VALIDEE: ['RETIREE'],
  RETIREE: ['VALIDEE'],
};

export async function changerStatutInscription(classeId: string, apprenantId: string, statut: StatutInscription) {
  return prisma.$transaction(async (tx) => {
    const inscription = await tx.inscription.findUnique({
      where: { classeId_apprenantId: { classeId, apprenantId } },
      include: { classe: { select: { capaciteMax: true } } },
    });
    if (!inscription) throw introuvable('Inscription introuvable');
    if (!transitions[inscription.statut].includes(statut)) {
      throw conflit(`Transition impossible : ${inscription.statut} → ${statut}`, 'TRANSITION_INVALIDE');
    }
    if (statut === 'VALIDEE') await verifierPlaceDisponible(tx, classeId, inscription.classe.capaciteMax);

    return tx.inscription.update({
      where: { classeId_apprenantId: { classeId, apprenantId } },
      data: { statut },
    });
  });
}
