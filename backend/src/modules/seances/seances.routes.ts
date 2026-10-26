import { Router } from 'express';
import { authentifier } from '../../middlewares/authentifier.js';
import { lire } from '../../utils/lire.js';
import { idParams } from '../../utils/schemas.js';
import { modificationSeanceSchema } from './seances.schemas.js';
import { correctionsSchema, corrigerPresences, feuillePresence } from '../presences/presences.feuilles.js';
import {
  demarrerSeance,
  participantsSeance,
  quitterSeance,
  rejoindreSeance,
  terminerSeance,
} from '../salle/salle.service.js';
import { annulerSeance, modifierSeance, obtenirSeance } from './seances.service.js';

/** Séances (cahier de conception, section 11). Les droits fins (RG4) sont vérifiés dans le service. */
export const seancesRouter = Router();

seancesRouter.use(authentifier);

/** GET /api/seances/:id — détail (ajout à la section 11) */
seancesRouter.get('/:id', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json({ seance: await obtenirSeance(req.utilisateur!, id) });
});

/** PATCH /api/seances/:id — modifier une séance programmée */
seancesRouter.patch('/:id', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json({ seance: await modifierSeance(req.utilisateur!, id, lire(modificationSeanceSchema, req.body)) });
});

/** POST /api/seances/:id/annuler — annuler une séance programmée */
seancesRouter.post('/:id/annuler', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json({ seance: await annulerSeance(req.utilisateur!, id) });
});

// --- Classe virtuelle (figures 6 à 8) ----------------------------------------------------------

/** POST /api/seances/:id/demarrer — enseignant affecté : crée la réunion BBB, URL modérateur */
seancesRouter.post('/:id/demarrer', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json(await demarrerSeance(req.utilisateur!, id));
});

/** POST /api/seances/:id/rejoindre — apprenant inscrit ou enseignant affecté ; 409 si non démarrée */
seancesRouter.post('/:id/rejoindre', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json(await rejoindreSeance(req.utilisateur!, id));
});

/** POST /api/seances/:id/quitter — ajout : enregistre l'heure de départ (aussi envoyé à la fermeture de l'onglet) */
seancesRouter.post('/:id/quitter', async (req, res) => {
  const { id } = lire(idParams, req.params);
  await quitterSeance(req.utilisateur!, id);
  res.status(204).end();
});

/** POST /api/seances/:id/terminer — ajout : l'enseignant ferme la salle et clôture les présences */
seancesRouter.post('/:id/terminer', async (req, res) => {
  const { id } = lire(idParams, req.params);
  await terminerSeance(req.utilisateur!, id);
  res.json({ seance: await obtenirSeance(req.utilisateur!, id) });
});

/** GET /api/seances/:id/presences — feuille de présence (Enseignant affecté, Administrateur) */
seancesRouter.get('/:id/presences', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json(await feuillePresence(req.utilisateur!, id));
});

/** PUT /api/seances/:id/presences — ajout : corrections de l'enseignant après la séance */
seancesRouter.put('/:id/presences', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json(await corrigerPresences(req.utilisateur!, id, lire(correctionsSchema, req.body)));
});

/** GET /api/seances/:id/participants — ajout : état en direct des participants (panneau de la salle) */
seancesRouter.get('/:id/participants', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json(await participantsSeance(req.utilisateur!, id));
});
