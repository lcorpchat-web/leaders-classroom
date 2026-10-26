import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { lire } from '../../utils/lire.js';
import { uuid } from '../../utils/schemas.js';
import { cloturerSeance, verifierJetonFinSeance } from './salle.service.js';

/** Rappels envoyés par le serveur BigBlueButton (pas de session utilisateur). */
export const bbbRouter = Router();

const finSeanceSchema = z.object({
  seanceId: uuid,
  jeton: z.string().min(1),
  /** Ajouté par BBB à l'URL de rappel */
  meetingID: z.string().optional(),
});

/**
 * GET /api/bbb/fin-seance — rappel de fin de réunion (figure 8).
 * Vérifié avant tout traitement (section 12) : jeton signé par notre serveur et réunion connue.
 */
bbbRouter.get('/fin-seance', async (req, res) => {
  const { seanceId, jeton, meetingID } = lire(finSeanceSchema, req.query);
  if (!verifierJetonFinSeance(seanceId, jeton)) {
    res.status(403).json({ error: { code: 'JETON_INVALIDE', message: 'Rappel non autorisé' } });
    return;
  }
  const seance = await prisma.seance.findUnique({ where: { id: seanceId }, select: { meetingIdBBB: true } });
  if (!seance || (meetingID && seance.meetingIdBBB !== meetingID)) {
    res.status(404).json({ error: { code: 'INTROUVABLE', message: 'Réunion inconnue' } });
    return;
  }
  await cloturerSeance(seanceId);
  res.status(200).end();
});
