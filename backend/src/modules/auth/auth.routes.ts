import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { valider } from '../../middlewares/valider.js';
import { authentifier as authentifierUtilisateur } from './auth.service.js';
import { connexionSchema, type ConnexionInput } from './auth.schemas.js';
import { fermerSession, ouvrirSession } from './session.js';

export const authRouter = Router();

// Limite les essais de mots de passe : 10 tentatives par adresse IP toutes les 15 minutes.
const limiteConnexion = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    error: { code: 'TROP_DE_TENTATIVES', message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  },
});

/** POST /api/auth/connexion — Public (cahier de conception, section 11) */
authRouter.post('/connexion', limiteConnexion, valider(connexionSchema), async (req, res) => {
  const donnees = req.body as ConnexionInput;
  const utilisateur = await authentifierUtilisateur(donnees);
  ouvrirSession(res, utilisateur, donnees.seSouvenir);
  res.json({ utilisateur });
});

/** POST /api/auth/deconnexion — supprime le cookie de session (sans effet si déjà déconnecté) */
authRouter.post('/deconnexion', (_req, res) => {
  fermerSession(res);
  res.status(204).end();
});
