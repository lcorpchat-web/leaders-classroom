import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { conflit, HttpError, introuvable } from '../../utils/http-error.js';
import { genererMotDePasseProvisoire, hacherMotDePasse } from '../../utils/mot-de-passe.js';
import { skipTake, type Page } from '../../utils/pagination.js';
import type { CreationUtilisateur, ListeUtilisateurs, ModificationUtilisateur } from './utilisateurs.schemas.js';

/** Champs exposés à l'administration (jamais le hachage du mot de passe). */
export const champsUtilisateur = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  telephone: true,
  role: true,
  matricule: true,
  specialite: true,
  photo: true,
  ville: true,
  actif: true,
  doitChangerMotDePasse: true,
  creeLe: true,
} as const satisfies Prisma.UtilisateurSelect;

export type UtilisateurAdmin = Prisma.UtilisateurGetPayload<{ select: typeof champsUtilisateur }>;

export async function listerUtilisateurs(filtres: ListeUtilisateurs): Promise<Page<UtilisateurAdmin>> {
  const where: Prisma.UtilisateurWhereInput = {
    role: filtres.role,
    actif: filtres.actif,
    ...(filtres.recherche && {
      OR: ['nom', 'prenom', 'email', 'matricule'].map((champ) => ({
        [champ]: { contains: filtres.recherche, mode: 'insensitive' as const },
      })),
    }),
  };

  const [donnees, total] = await prisma.$transaction([
    prisma.utilisateur.findMany({
      where,
      select: champsUtilisateur,
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      ...skipTake(filtres),
    }),
    prisma.utilisateur.count({ where }),
  ]);

  return { donnees, total, page: filtres.page, parPage: filtres.parPage };
}

async function verifierUnicite(email?: string, matricule?: string | null, saufId?: string) {
  if (email) {
    const existant = await prisma.utilisateur.findUnique({ where: { email }, select: { id: true } });
    if (existant && existant.id !== saufId) throw conflit('Cette adresse e-mail est déjà utilisée', 'EMAIL_DEJA_UTILISE');
  }
  if (matricule) {
    const existant = await prisma.utilisateur.findUnique({ where: { matricule }, select: { id: true } });
    if (existant && existant.id !== saufId) throw conflit('Ce matricule est déjà utilisé', 'MATRICULE_DEJA_UTILISE');
  }
}

/** Matricule séquentiel par année : LC-2026-0001, LC-2026-0002… */
async function genererMatricule(): Promise<string> {
  const prefixe = `LC-${new Date().getFullYear()}-`;
  const dernier = await prisma.utilisateur.findFirst({
    where: { matricule: { startsWith: prefixe } },
    orderBy: { matricule: 'desc' },
    select: { matricule: true },
  });
  const suivant = dernier?.matricule ? Number(dernier.matricule.slice(prefixe.length)) + 1 : 1;
  return `${prefixe}${String(suivant).padStart(4, '0')}`;
}

/**
 * Crée un compte avec un mot de passe provisoire, renvoyé une seule fois à l'administrateur
 * pour qu'il le transmette (aucun service d'e-mail en V1). L'utilisateur devra le changer.
 */
export async function creerUtilisateur(donnees: CreationUtilisateur) {
  const estApprenant = donnees.role === 'APPRENANT';
  const matricule = estApprenant ? (donnees.matricule ?? (await genererMatricule())) : null;
  await verifierUnicite(donnees.email, matricule);

  const motDePasseProvisoire = genererMotDePasseProvisoire();
  const utilisateur = await prisma.utilisateur.create({
    data: {
      ...donnees,
      matricule,
      specialite: donnees.role === 'ENSEIGNANT' ? donnees.specialite : null,
      motDePasseHache: await hacherMotDePasse(motDePasseProvisoire),
      doitChangerMotDePasse: true,
    },
    select: champsUtilisateur,
  });

  return { utilisateur, motDePasseProvisoire };
}

export async function modifierUtilisateur(id: string, donnees: ModificationUtilisateur, auteurId: string) {
  const existant = await prisma.utilisateur.findUnique({ where: { id }, select: { role: true } });
  if (!existant) throw introuvable('Utilisateur introuvable');

  if (id === auteurId && donnees.actif === false) {
    throw new HttpError(409, 'Vous ne pouvez pas désactiver votre propre compte', 'AUTO_DESACTIVATION');
  }
  if (donnees.matricule !== undefined && existant.role !== 'APPRENANT') {
    delete donnees.matricule;
  }
  await verifierUnicite(donnees.email, donnees.matricule, id);

  return prisma.utilisateur.update({ where: { id }, data: donnees, select: champsUtilisateur });
}

/** Attribue un nouveau mot de passe provisoire (cas « mot de passe oublié » géré par l'administration). */
export async function reinitialiserMotDePasse(id: string) {
  const motDePasseProvisoire = genererMotDePasseProvisoire();
  const utilisateur = await prisma.utilisateur
    .update({
      where: { id },
      data: { motDePasseHache: await hacherMotDePasse(motDePasseProvisoire), doitChangerMotDePasse: true },
      select: champsUtilisateur,
    })
    .catch(() => {
      throw introuvable('Utilisateur introuvable');
    });
  return { utilisateur, motDePasseProvisoire };
}
