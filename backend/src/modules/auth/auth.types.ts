import type { Role } from '../../generated/prisma/client.js';

/** Informations de l'utilisateur connecté exposées à l'API et au frontend (jamais le hachage). */
export interface UtilisateurSession {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  /** Nom du fichier de la photo de profil (null : initiales) */
  photo: string | null;
  /** true : mot de passe provisoire, le frontend impose d'en choisir un nouveau */
  doitChangerMotDePasse: boolean;
}

/** Contenu du jeton de session signé */
export interface JetonSession {
  sub: string;
  role: Role;
}
