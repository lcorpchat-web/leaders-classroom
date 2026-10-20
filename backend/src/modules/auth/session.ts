import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import type { Role } from '../../generated/prisma/client.js';
import type { JetonSession } from './auth.types.js';

/** Nom du cookie de session (cahier de conception, section 12 : cookie httpOnly, Secure et SameSite). */
export const COOKIE_SESSION = 'lc_session';

const HEURE_MS = 60 * 60 * 1000;

function optionsCookie(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'strict',
    path: '/',
  };
}

/** Crée le jeton signé et le dépose dans le cookie de session. */
export function ouvrirSession(res: Response, utilisateur: { id: string; role: Role }, seSouvenir: boolean): void {
  const dureeMs = seSouvenir ? env.sessionSouvenirJours * 24 * HEURE_MS : env.sessionDureeHeures * HEURE_MS;

  const payload: JetonSession = { sub: utilisateur.id, role: utilisateur.role };
  const jeton = jwt.sign(payload, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: Math.floor(dureeMs / 1000),
  });

  res.cookie(COOKIE_SESSION, jeton, {
    ...optionsCookie(),
    // Sans « Se souvenir de moi » : cookie de session, supprimé à la fermeture du navigateur
    ...(seSouvenir && { maxAge: dureeMs }),
  });
}

export function fermerSession(res: Response): void {
  res.clearCookie(COOKIE_SESSION, optionsCookie());
}

/** Vérifie la signature et l'expiration du jeton ; renvoie null s'il est invalide. */
export function lireJeton(jeton: string): JetonSession | null {
  try {
    const payload = jwt.verify(jeton, env.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload === 'object' && typeof payload.sub === 'string' && typeof payload.role === 'string') {
      return { sub: payload.sub, role: payload.role as Role };
    }
    return null;
  } catch {
    return null;
  }
}
