import { randomInt } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const COUT_BCRYPT = 12;

export const hacherMotDePasse = (motDePasse: string) => bcrypt.hash(motDePasse, COUT_BCRYPT);

export const verifierMotDePasse = (motDePasse: string, hache: string) => bcrypt.compare(motDePasse, hache);

/** Règle de robustesse appliquée à tout mot de passe choisi par un utilisateur. */
export const motDePasseRobuste = z
  .string()
  .min(8, 'Au moins 8 caractères')
  .max(128, 'Au plus 128 caractères')
  .regex(/[A-Za-z]/, 'Au moins une lettre')
  .regex(/\d/, 'Au moins un chiffre');

// Sans caractères ambigus (0/O, 1/l/I) : le mot de passe est dicté ou recopié par l'utilisateur
const LETTRES = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
const CHIFFRES = '23456789';

/** Génère un mot de passe provisoire lisible (10 caractères, lettres et chiffres). */
export function genererMotDePasseProvisoire(longueur = 10): string {
  const alphabet = LETTRES + CHIFFRES;
  const caracteres = [LETTRES[randomInt(LETTRES.length)], CHIFFRES[randomInt(CHIFFRES.length)]];
  while (caracteres.length < longueur) caracteres.push(alphabet[randomInt(alphabet.length)]);
  // Mélange de Fisher-Yates
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [caracteres[i], caracteres[j]] = [caracteres[j]!, caracteres[i]!];
  }
  return caracteres.join('');
}
