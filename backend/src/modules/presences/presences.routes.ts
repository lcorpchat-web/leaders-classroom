import { Router } from 'express';
import { authentifier } from '../../middlewares/authentifier.js';
import { autoriser } from '../../middlewares/autoriser.js';
import { lire } from '../../utils/lire.js';
import { rapportClasse, rapportSchema } from './presences.feuilles.js';

/** Rapports de présence (Administrateur : toutes les classes ; Enseignant : ses classes). */
export const presencesRouter = Router();

presencesRouter.use(authentifier, autoriser('ADMIN', 'ENSEIGNANT'));

/** GET /api/presences/rapport?classeId= — ajout : taux de présence par apprenant */
presencesRouter.get('/rapport', async (req, res) => {
  const { classeId } = lire(rapportSchema, req.query);
  res.json(await rapportClasse(req.utilisateur!, classeId));
});
