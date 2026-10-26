import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import type { Response } from 'express';
import multer from 'multer';
import { env } from '../../config/env.js';
import { HttpError, introuvable } from '../../utils/http-error.js';

/** Photos de profil et images de classe : uploads/images (jamais servi directement). */
const DOSSIER_IMAGES = path.resolve(env.supports.dossier, 'images');
mkdirSync(DOSSIER_IMAGES, { recursive: true });

const TYPES_IMAGES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Réception d'une image (maquette 04 : JPG, PNG, 2 Mo max), champ multipart « image » */
export const receptionImage = multer({
  storage: multer.diskStorage({
    destination: DOSSIER_IMAGES,
    filename: (_req, fichier, cb) => cb(null, `${randomUUID()}.${TYPES_IMAGES[fichier.mimetype] ?? 'img'}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, fichier, cb) => {
    if (TYPES_IMAGES[fichier.mimetype]) cb(null, true);
    else cb(new HttpError(415, 'Formats acceptés : JPG, PNG ou WebP', 'FORMAT_REFUSE'));
  },
}).single('image');

export function exigerImage(fichier: Express.Multer.File | undefined): Express.Multer.File {
  if (!fichier) throw new HttpError(400, 'Aucune image reçue', 'FICHIER_MANQUANT');
  return fichier;
}

/** Supprime une image du disque (ancienne photo remplacée, dépôt annulé) */
export async function supprimerImage(nom: string | null | undefined): Promise<void> {
  if (nom) await unlink(path.join(DOSSIER_IMAGES, path.basename(nom))).catch(() => undefined);
}

/** Envoie l'image ; le nom change à chaque remplacement, elle peut donc être mise en cache longtemps. */
export function envoyerImage(res: Response, nom: string | null | undefined): void {
  if (!nom) throw introuvable('Image introuvable');
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.sendFile(path.join(DOSSIER_IMAGES, path.basename(nom)));
}
