import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authentifier } from '../../middlewares/authentifier.js';
import { autoriser } from '../../middlewares/autoriser.js';
import { lire } from '../../utils/lire.js';
import { idParams } from '../../utils/schemas.js';
import { envoyerImage } from '../images/images.service.js';
import {
  creationUtilisateurSchema,
  listeUtilisateursSchema,
  modificationUtilisateurSchema,
} from './utilisateurs.schemas.js';
import {
  creerUtilisateur,
  listerUtilisateurs,
  modifierUtilisateur,
  reinitialiserMotDePasse,
} from './utilisateurs.service.js';

/** Gestion des comptes — Administrateur uniquement (matrice des droits, section 3.1). */
export const utilisateursRouter = Router();

utilisateursRouter.use(authentifier);

/** GET /api/utilisateurs/:id/photo — photo de profil, visible par tout utilisateur connecté */
utilisateursRouter.get('/:id/photo', async (req, res) => {
  const { id } = lire(idParams, req.params);
  const utilisateur = await prisma.utilisateur.findUnique({ where: { id }, select: { photo: true } });
  envoyerImage(res, utilisateur?.photo);
});

utilisateursRouter.use(autoriser('ADMIN'));

/** GET /api/utilisateurs?role=&actif=&recherche=&page=&parPage= */
utilisateursRouter.get('/', async (req, res) => {
  res.json(await listerUtilisateurs(lire(listeUtilisateursSchema, req.query)));
});

/** POST /api/utilisateurs — renvoie le mot de passe provisoire (affiché une seule fois) */
utilisateursRouter.post('/', async (req, res) => {
  res.status(201).json(await creerUtilisateur(lire(creationUtilisateurSchema, req.body)));
});

/** PATCH /api/utilisateurs/:id — modifier, activer ou désactiver */
utilisateursRouter.patch('/:id', async (req, res) => {
  const { id } = lire(idParams, req.params);
  const utilisateur = await modifierUtilisateur(id, lire(modificationUtilisateurSchema, req.body), req.utilisateur!.id);
  res.json({ utilisateur });
});

/** POST /api/utilisateurs/:id/reinitialiser-mot-de-passe — ajout : nouveau mot de passe provisoire */
utilisateursRouter.post('/:id/reinitialiser-mot-de-passe', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json(await reinitialiserMotDePasse(id));
});
