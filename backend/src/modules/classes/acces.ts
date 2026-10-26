import type { Prisma } from '../../generated/prisma/client.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError, introuvable } from '../../utils/http-error.js';
import type { UtilisateurSession } from '../auth/auth.types.js';

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Contrôle d'accès à une classe (matrice des droits, section 3.1) :
 * - « gestion » : administration ou enseignant affecté (RG4) ;
 * - « lecture » : en plus, apprenant dont l'inscription est VALIDEE (RG2).
 * Une classe non accessible en lecture est signalée comme introuvable.
 */
export async function verifierAccesClasse(
  utilisateur: UtilisateurSession,
  classeId: string,
  mode: 'lecture' | 'gestion',
  client: Client = prisma,
): Promise<void> {
  const classe = await client.classe.findUnique({ where: { id: classeId }, select: { id: true } });
  if (!classe) throw introuvable('Classe introuvable');
  if (utilisateur.role === 'ADMIN') return;

  if (utilisateur.role === 'ENSEIGNANT') {
    const affecte = await client.affectation.findUnique({
      where: { classeId_enseignantId: { classeId, enseignantId: utilisateur.id } },
    });
    if (affecte) return;
  }

  if (mode === 'lecture' && utilisateur.role === 'APPRENANT') {
    const inscrit = await client.inscription.findFirst({
      where: { classeId, apprenantId: utilisateur.id, statut: 'VALIDEE' },
    });
    if (inscrit) return;
  }

  if (mode === 'gestion' && utilisateur.role !== 'APPRENANT') {
    throw new HttpError(403, 'Vous n’êtes pas affecté à cette classe', 'ACCES_REFUSE');
  }
  throw mode === 'gestion' ? new HttpError(403, 'Accès refusé', 'ACCES_REFUSE') : introuvable('Classe introuvable');
}
