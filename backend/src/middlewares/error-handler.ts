import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

// Express 5 transmet automatiquement les erreurs des handlers async à ce middleware.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }

  // JSON mal formé envoyé par le client (erreur levée par express.json())
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Corps de requête JSON invalide' } });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: env.isProduction ? 'Erreur interne du serveur' : String(err),
    },
  });
}
