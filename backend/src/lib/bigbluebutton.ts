import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

/**
 * Adaptateur BigBlueButton (figure 12) : appels signés par le secret partagé, qui ne quitte
 * jamais le serveur (section 12). Documentation : https://docs.bigbluebutton.org/development/api
 */

const { url: BASE, secret: SECRET, algorithme } = env.bbb;

/** Serveur BBB configuré ? Sinon : mode simulation, autorisé uniquement hors production. */
export const bbbConfigure = Boolean(BASE && SECRET);
export const bbbSimulation = !bbbConfigure && !env.isProduction;

function urlSignee(appel: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  const checksum = createHash(algorithme).update(appel + query + SECRET).digest('hex');
  return `${BASE}api/${appel}?${query}&checksum=${checksum}`;
}

async function appeler(appel: string, params: Record<string, string>): Promise<string> {
  let xml: string;
  try {
    const reponse = await fetch(urlSignee(appel, params), { signal: AbortSignal.timeout(10_000) });
    xml = await reponse.text();
  } catch {
    // Figure 6, scénario 4a : BigBlueButton ne répond pas
    throw new HttpError(502, 'La salle virtuelle ne répond pas. Réessayez dans un instant.', 'BBB_INDISPONIBLE');
  }
  if (/<returncode>\s*SUCCESS\s*<\/returncode>/.test(xml)) return xml;
  const message = /<message>([^<]*)<\/message>/.exec(xml)?.[1] ?? 'réponse inattendue';
  throw new HttpError(502, `Erreur de la salle virtuelle : ${message}`, 'BBB_ERREUR');
}

function exigerConfiguration() {
  if (!bbbConfigure && !bbbSimulation) {
    throw new HttpError(503, 'La salle virtuelle n’est pas configurée sur ce serveur', 'BBB_NON_CONFIGURE');
  }
}

export interface ReunionBBB {
  meetingID: string;
  nom: string;
  dureeMinutes: number;
  logoutURL: string;
  endCallbackUrl: string;
}

/** create — idempotent côté BBB : renvoie la réunion existante si elle tourne déjà. */
export async function creerReunion(r: ReunionBBB): Promise<void> {
  exigerConfiguration();
  if (bbbSimulation) return;
  await appeler('create', {
    meetingID: r.meetingID,
    name: r.nom,
    // Enregistrement désactivé tant que la politique n'est pas validée (cahier des charges, point 12)
    record: 'false',
    allowStartStopRecording: 'false',
    // Marge de 30 min au-delà de la durée prévue avant fermeture automatique
    duration: String(r.dureeMinutes + 30),
    logoutURL: r.logoutURL,
    'meta_endCallbackUrl': r.endCallbackUrl,
    welcome: `Bienvenue dans la classe <b>${r.nom}</b> — Leaders Classroom`,
  });
}

/** URL de connexion signée ; le rôle MODERATOR donne le contrôle du tableau, des documents et du partage. */
export function urlRejoindre(p: { meetingID: string; nomComplet: string; role: 'MODERATOR' | 'VIEWER'; userID: string }) {
  exigerConfiguration();
  if (bbbSimulation) return null;
  return urlSignee('join', {
    meetingID: p.meetingID,
    fullName: p.nomComplet,
    role: p.role,
    userID: p.userID,
    redirect: 'true',
  });
}

export async function reunionEnCours(meetingID: string): Promise<boolean> {
  exigerConfiguration();
  if (bbbSimulation) return true;
  const xml = await appeler('isMeetingRunning', { meetingID });
  return /<running>\s*true\s*<\/running>/.test(xml);
}

/** end — termine la réunion pour tous ; sans effet si elle est déjà fermée. */
export async function terminerReunion(meetingID: string): Promise<void> {
  if (!bbbConfigure) return;
  await appeler('end', { meetingID }).catch(() => undefined);
}
