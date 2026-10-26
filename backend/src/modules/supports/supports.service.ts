import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { HttpError, introuvable } from '../../utils/http-error.js';
import { uuid } from '../../utils/schemas.js';
import type { UtilisateurSession } from '../auth/auth.types.js';
import { verifierAccesClasse } from '../classes/acces.js';

/** Dossier absolu des supports ; créé au démarrage s'il n'existe pas. */
export const DOSSIER_SUPPORTS = path.resolve(env.supports.dossier);
mkdirSync(DOSSIER_SUPPORTS, { recursive: true });

/** Formats acceptés (section 12 : type et taille limités) */
export const TYPES_AUTORISES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-powerpoint': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.oasis.opendocument.text': 'OpenDocument',
  'application/vnd.oasis.opendocument.presentation': 'OpenDocument',
  'application/vnd.oasis.opendocument.spreadsheet': 'OpenDocument',
  'text/plain': 'Texte',
  'image/png': 'Image',
  'image/jpeg': 'Image',
  'image/webp': 'Image',
  'audio/mpeg': 'Audio',
  'video/mp4': 'Vidéo',
};

/** Types affichables directement dans le navigateur (aperçu) */
const APERCU = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'video/mp4', 'text/plain']);

/** Réception du fichier : nom aléatoire sur le disque (jamais le nom fourni par l'utilisateur). */
export const receptionSupport = multer({
  storage: multer.diskStorage({
    destination: DOSSIER_SUPPORTS,
    filename: (_req, _fichier, cb) => cb(null, randomUUID()),
  }),
  limits: { fileSize: env.supports.tailleMaxMo * 1024 * 1024, files: 1 },
  fileFilter: (_req, fichier, cb) => {
    if (TYPES_AUTORISES[fichier.mimetype]) cb(null, true);
    else cb(new HttpError(415, 'Format de fichier non accepté (PDF, Office, images, audio ou vidéo MP4)', 'FORMAT_REFUSE'));
  },
}).single('fichier');

export const depotSchema = z.object({
  titre: z.string().trim().min(1, 'Titre requis').max(150),
  /** RG8 : rattachement facultatif à une séance de la classe */
  seanceId: z.union([uuid, z.literal('')]).optional().transform((v) => v || undefined),
});

const champsSupport = {
  id: true,
  titre: true,
  nomFichier: true,
  typeMime: true,
  tailleOctets: true,
  deposeLe: true,
  classe: { select: { id: true, nom: true } },
  seance: { select: { id: true, titre: true, debut: true } },
  deposePar: { select: { id: true, nom: true, prenom: true } },
} as const;

/** GET /api/classes/:id/supports — supports autorisés (section 8 du cahier des charges) */
export async function listerSupports(utilisateur: UtilisateurSession, classeId: string) {
  await verifierAccesClasse(utilisateur, classeId, 'lecture');
  return prisma.support.findMany({ where: { classeId }, select: champsSupport, orderBy: { deposeLe: 'desc' } });
}

/** Derniers supports des classes accessibles (tableaux de bord) */
export function derniersSupports(where: object, nombre = 5) {
  return prisma.support.findMany({ where, select: champsSupport, orderBy: { deposeLe: 'desc' }, take: nombre });
}

/** POST /api/classes/:id/supports — dépôt (Administrateur, enseignant affecté) */
export async function deposerSupport(
  utilisateur: UtilisateurSession,
  classeId: string,
  fichier: Express.Multer.File | undefined,
  donnees: z.infer<typeof depotSchema>,
) {
  if (!fichier) throw new HttpError(400, 'Aucun fichier reçu', 'FICHIER_MANQUANT');
  try {
    await verifierAccesClasse(utilisateur, classeId, 'gestion');
    if (donnees.seanceId) {
      const seance = await prisma.seance.findFirst({ where: { id: donnees.seanceId, classeId } });
      if (!seance) throw new HttpError(400, 'Cette séance n’appartient pas à la classe', 'SEANCE_INVALIDE');
    }
    return await prisma.support.create({
      data: {
        id: fichier.filename,
        classeId,
        seanceId: donnees.seanceId,
        titre: donnees.titre,
        // Nom d'origine conservé pour le téléchargement (encodage UTF-8 restauré)
        nomFichier: Buffer.from(fichier.originalname, 'latin1').toString('utf8').slice(0, 255),
        typeMime: fichier.mimetype,
        tailleOctets: fichier.size,
        deposeParId: utilisateur.id,
      },
      select: champsSupport,
    });
  } catch (erreur) {
    // Aucun fichier orphelin sur le disque
    await unlink(fichier.path).catch(() => undefined);
    throw erreur;
  }
}

/** Fichier d'un support, après contrôle des droits (jamais de lien public direct, section 12). */
export async function fichierSupport(utilisateur: UtilisateurSession, id: string) {
  const support = await prisma.support.findUnique({
    where: { id },
    select: { id: true, classeId: true, nomFichier: true, typeMime: true },
  });
  if (!support) throw introuvable('Support introuvable');
  await verifierAccesClasse(utilisateur, support.classeId, 'lecture');
  return {
    chemin: path.join(DOSSIER_SUPPORTS, support.id),
    nomFichier: support.nomFichier,
    typeMime: support.typeMime,
    apercuPossible: APERCU.has(support.typeMime),
  };
}

/** DELETE /api/supports/:id — retrait (Administrateur, enseignant affecté) */
export async function supprimerSupport(utilisateur: UtilisateurSession, id: string) {
  const support = await prisma.support.findUnique({ where: { id }, select: { classeId: true } });
  if (!support) throw introuvable('Support introuvable');
  await verifierAccesClasse(utilisateur, support.classeId, 'gestion');
  await prisma.support.delete({ where: { id } });
  await unlink(path.join(DOSSIER_SUPPORTS, id)).catch(() => undefined);
}
