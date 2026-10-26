import { Router } from 'express';
import { authentifier } from '../../middlewares/authentifier.js';
import { autoriser } from '../../middlewares/autoriser.js';
import { lire } from '../../utils/lire.js';
import { idParams } from '../../utils/schemas.js';
import { prisma } from '../../lib/prisma.js';
import { envoyerImage, exigerImage, receptionImage, supprimerImage } from '../images/images.service.js';
import { creationSeanceSchema } from '../seances/seances.schemas.js';
import { programmerSeances } from '../seances/seances.service.js';
import { deposerSupport, depotSchema, listerSupports, receptionSupport } from '../supports/supports.service.js';
import {
  affectationParams,
  affectationSchema,
  creationClasseSchema,
  inscriptionParams,
  inscriptionSchema,
  listeClassesSchema,
  modificationClasseSchema,
  statutInscriptionSchema,
} from './classes.schemas.js';
import {
  affecterEnseignant,
  changerStatutInscription,
  creerClasse,
  inscrireApprenant,
  listerClasses,
  modifierClasse,
  obtenirClasse,
  retirerEnseignant,
} from './classes.service.js';

/** Classes, affectations et inscriptions (cahier de conception, section 11). */
export const classesRouter = Router();

classesRouter.use(authentifier);

const admin = autoriser('ADMIN');

/** GET /api/classes — tous les rôles, filtré selon les droits (amélioration : la section 11 la réservait à l'admin) */
classesRouter.get('/', async (req, res) => {
  res.json(await listerClasses(req.utilisateur!, lire(listeClassesSchema, req.query)));
});

/** POST /api/classes — créer une classe avec ses enseignants (RG1) */
classesRouter.post('/', admin, async (req, res) => {
  res.status(201).json({ classe: await creerClasse(lire(creationClasseSchema, req.body)) });
});

/** GET /api/classes/:id/image — vignette de la classe (tout utilisateur connecté) */
classesRouter.get('/:id/image', async (req, res) => {
  const { id } = lire(idParams, req.params);
  const classe = await prisma.classe.findUnique({ where: { id }, select: { image: true } });
  envoyerImage(res, classe?.image);
});

/** PUT /api/classes/:id/image — image de la classe (maquette 04, Administrateur) */
classesRouter.put('/:id/image', admin, receptionImage, async (req, res) => {
  const { id } = lire(idParams, req.params);
  const fichier = exigerImage(req.file);
  const ancienne = await prisma.classe.findUnique({ where: { id }, select: { image: true } });
  if (!ancienne) {
    await supprimerImage(fichier.filename);
    res.status(404).json({ error: { code: 'INTROUVABLE', message: 'Classe introuvable' } });
    return;
  }
  await prisma.classe.update({ where: { id }, data: { image: fichier.filename } });
  await supprimerImage(ancienne.image);
  res.json({ image: fichier.filename });
});

/** DELETE /api/classes/:id/image */
classesRouter.delete('/:id/image', admin, async (req, res) => {
  const { id } = lire(idParams, req.params);
  const ancienne = await prisma.classe.findUnique({ where: { id }, select: { image: true } });
  await prisma.classe.update({ where: { id }, data: { image: null } });
  await supprimerImage(ancienne?.image);
  res.status(204).end();
});

/** GET /api/classes/:id — détail (ajout à la section 11) */
classesRouter.get('/:id', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json({ classe: await obtenirClasse(req.utilisateur!, id) });
});

/** PATCH /api/classes/:id — modifier, archiver ou réactiver (ajout à la section 11) */
classesRouter.patch('/:id', admin, async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json({ classe: await modifierClasse(id, lire(modificationClasseSchema, req.body)) });
});

/** POST /api/classes/:id/enseignants — affecter un enseignant */
classesRouter.post('/:id/enseignants', admin, async (req, res) => {
  const { id } = lire(idParams, req.params);
  await affecterEnseignant(id, lire(affectationSchema, req.body).enseignantId);
  res.status(201).json({ classe: await obtenirClasse(req.utilisateur!, id) });
});

/** DELETE /api/classes/:id/enseignants/:enseignantId — retirer une affectation (ajout, RG1) */
classesRouter.delete('/:id/enseignants/:enseignantId', admin, async (req, res) => {
  const { id, enseignantId } = lire(affectationParams, req.params);
  await retirerEnseignant(id, enseignantId);
  res.status(204).end();
});

/** POST /api/classes/:id/inscriptions — inscrire un apprenant */
classesRouter.post('/:id/inscriptions', admin, async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.status(201).json({ inscription: await inscrireApprenant(id, lire(inscriptionSchema, req.body).apprenantId) });
});

/** POST /api/classes/:id/seances — programmer une séance (Enseignant affecté ou Administrateur, RG4) */
classesRouter.post('/:id/seances', async (req, res) => {
  const { id } = lire(idParams, req.params);
  const seances = await programmerSeances(req.utilisateur!, id, lire(creationSeanceSchema, req.body));
  res.status(201).json({ seances });
});

/** GET /api/classes/:id/supports — consulter les supports (selon les droits) */
classesRouter.get('/:id/supports', async (req, res) => {
  const { id } = lire(idParams, req.params);
  res.json({ supports: await listerSupports(req.utilisateur!, id) });
});

/** POST /api/classes/:id/supports — déposer un support (multipart : fichier, titre, seanceId facultatif) */
classesRouter.post('/:id/supports', receptionSupport, async (req, res) => {
  const { id } = lire(idParams, req.params);
  const support = await deposerSupport(req.utilisateur!, id, req.file, lire(depotSchema, req.body));
  res.status(201).json({ support });
});

/** PATCH /api/classes/:id/inscriptions/:apprenantId — valider, refuser, retirer, réinscrire (ajout, figure 11) */
classesRouter.patch('/:id/inscriptions/:apprenantId', admin, async (req, res) => {
  const { id, apprenantId } = lire(inscriptionParams, req.params);
  const { statut } = lire(statutInscriptionSchema, req.body);
  res.json({ inscription: await changerStatutInscription(id, apprenantId, statut) });
});
