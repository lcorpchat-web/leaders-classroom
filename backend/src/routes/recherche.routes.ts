import { Router } from 'express';
import { authentifier } from '../middlewares/authentifier.js';
import { rechercher, rechercheSchema } from '../modules/moi/espace.service.js';
import { lire } from '../utils/lire.js';

/** Recherche globale de la barre du haut (classes, étudiants, documents selon les droits). */
export const rechercheRouter = Router();

rechercheRouter.use(authentifier);

/** GET /api/recherche?q= */
rechercheRouter.get('/', async (req, res) => {
  const { q } = lire(rechercheSchema, req.query);
  res.json(await rechercher(req.utilisateur!, q));
});
