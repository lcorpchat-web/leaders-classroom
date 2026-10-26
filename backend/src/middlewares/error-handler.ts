import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { MulterError } from 'multer';
import { Prisma } from '../generated/prisma/client.js';
import { HttpError } from '../utils/http-error.js';

// Express 5 transmet automatiquement les erreurs des handlers async à ce middleware.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.champs && { champs: err.champs }) },
    });
    return;
  }

  // JSON mal formé envoyé par le client (erreur levée par express.json())
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Corps de requête JSON invalide' } });
    return;
  }

  // Dépôt de fichier refusé par multer (taille, nombre de fichiers…)
  if (err instanceof MulterError) {
    const tropGros = err.code === 'LIMIT_FILE_SIZE';
    res.status(tropGros ? 413 : 400).json({
      error: {
        code: tropGros ? 'FICHIER_TROP_GROS' : 'DEPOT_INVALIDE',
        message: tropGros ? `Fichier trop volumineux (${env.supports.tailleMaxMo} Mo maximum)` : 'Dépôt de fichier invalide',
      },
    });
    return;
  }

  // Filets de sécurité pour les contraintes de la base (les services vérifient en amont)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: { code: 'DEJA_EXISTANT', message: 'Cette valeur est déjà utilisée' } });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: { code: 'INTROUVABLE', message: 'Ressource introuvable' } });
      return;
    }
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProduction ? 'Erreur interne du serveur' : String(err),
    },
  });
}
