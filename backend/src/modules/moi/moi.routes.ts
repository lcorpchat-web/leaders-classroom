import { Router } from 'express';
import { authentifier } from '../../middlewares/authentifier.js';

/** Espace personnel de l'utilisateur connecté (/api/moi). */
export const moiRouter = Router();

moiRouter.use(authentifier);

/**
 * GET /api/moi — profil de l'utilisateur connecté.
 * Ajout à la section 11 : nécessaire au frontend pour restaurer la session au rechargement de la page.
 */
moiRouter.get('/', (req, res) => {
  res.json({ utilisateur: req.utilisateur });
});
