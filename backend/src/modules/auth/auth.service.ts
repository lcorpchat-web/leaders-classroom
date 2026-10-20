import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/http-error.js';
import type { ConnexionInput } from './auth.schemas.js';
import type { UtilisateurSession } from './auth.types.js';

const champsSession = { id: true, nom: true, prenom: true, email: true, role: true } as const;

// Hachage factice comparé quand l'e-mail est inconnu : le temps de réponse reste identique,
// ce qui empêche de deviner quels e-mails possèdent un compte.
const HACHAGE_FACTICE = bcrypt.hashSync('compte-inexistant', 12);

/**
 * Authentification par e-mail et mot de passe (figure 5).
 * Message générique dans tous les cas d'échec, y compris pour un compte désactivé (RG7).
 */
export async function authentifier({ email, motDePasse }: ConnexionInput): Promise<UtilisateurSession> {
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { email },
    select: { ...champsSession, motDePasseHache: true, actif: true },
  });

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur?.motDePasseHache ?? HACHAGE_FACTICE);

  if (!utilisateur || !utilisateur.actif || !motDePasseValide) {
    throw new HttpError(401, 'Identifiants incorrects', 'IDENTIFIANTS_INCORRECTS');
  }

  const { motDePasseHache: _hache, actif: _actif, ...session } = utilisateur;
  return session;
}

/** Recharge l'utilisateur d'une session ; null s'il n'existe plus ou a été désactivé (RG7). */
export async function trouverUtilisateurActif(id: string): Promise<UtilisateurSession | null> {
  return prisma.utilisateur.findFirst({
    where: { id, actif: true },
    select: champsSession,
  });
}
