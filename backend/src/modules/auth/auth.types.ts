import type { Role } from '../../generated/prisma/client.js';

/** Informations de l'utilisateur connecté exposées à l'API et au frontend (jamais le hachage). */
export interface UtilisateurSession {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
}

/** Contenu du jeton de session signé */
export interface JetonSession {
  sub: string;
  role: Role;
}
