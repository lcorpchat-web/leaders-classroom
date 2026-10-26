import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { authentifier } from '../../middlewares/authentifier.js';
import { HttpError } from '../../utils/http-error.js';
import { lire } from '../../utils/lire.js';
import { texteFacultatif } from '../../utils/schemas.js';
import { exigerImage, receptionImage, supprimerImage } from '../images/images.service.js';
import { hacherMotDePasse, motDePasseRobuste, verifierMotDePasse } from '../../utils/mot-de-passe.js';
import { mesPresences } from '../presences/presences.feuilles.js';
import { planningSchema } from '../seances/seances.schemas.js';
import { planning } from '../seances/seances.service.js';
import { documentsSchema, etudiantsSchema, mesCours, mesDocuments, mesEtudiants } from './espace.service.js';
import { tableauDeBord, tableauDeBordSchema } from './tableau-de-bord.service.js';

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

/** GET /api/moi/planning?debut=&fin=&classeId= — séances visibles par l'utilisateur sur la période (section 11) */
moiRouter.get('/planning', async (req, res) => {
  res.json({ seances: await planning(req.utilisateur!, lire(planningSchema, req.query)) });
});

/** GET /api/moi/presences — historique et taux de présence de l'apprenant (« les siennes ») */
moiRouter.get('/presences', async (req, res) => {
  res.json(await mesPresences(req.utilisateur!));
});

/** GET /api/moi/tableau-de-bord — indicateurs selon le rôle (maquettes 02 et 03) */
moiRouter.get('/tableau-de-bord', async (req, res) => {
  const { periode } = lire(tableauDeBordSchema, req.query);
  res.json(await tableauDeBord(req.utilisateur!, periode));
});

/** GET /api/moi/etudiants?classeId=&recherche= — « Mes étudiants » (Enseignant, Administrateur) */
moiRouter.get('/etudiants', async (req, res) => {
  if (req.utilisateur!.role === 'APPRENANT') throw new HttpError(403, 'Accès refusé', 'ACCES_REFUSE');
  res.json({ etudiants: await mesEtudiants(req.utilisateur!, lire(etudiantsSchema, req.query)) });
});

/** GET /api/moi/cours — « Mes cours » */
moiRouter.get('/cours', async (req, res) => {
  res.json({ cours: await mesCours(req.utilisateur!) });
});

/** GET /api/moi/documents?classeId=&recherche= — « Mes documents » : supports de toutes mes classes */
moiRouter.get('/documents', async (req, res) => {
  res.json({ documents: await mesDocuments(req.utilisateur!, lire(documentsSchema, req.query)) });
});

// --- Profil (maquette 06 « Mon profil ») ----------------------------------------------------

const champsProfil = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  telephone: true,
  role: true,
  matricule: true,
  specialite: true,
  photo: true,
  ville: true,
  biographie: true,
  creeLe: true,
} as const;

/** GET /api/moi/profil — informations complètes du profil */
moiRouter.get('/profil', async (req, res) => {
  const profil = await prisma.utilisateur.findUniqueOrThrow({ where: { id: req.utilisateur!.id }, select: champsProfil });
  res.json({ profil });
});

/** Champs modifiables par l'utilisateur lui-même (nom, e-mail et rôle restent gérés par l'administration) */
const profilSchema = z
  .object({
    telephone: texteFacultatif(30),
    ville: texteFacultatif(100),
    biographie: texteFacultatif(1000),
    specialite: texteFacultatif(100),
  })
  .partial();

/** PATCH /api/moi/profil — « Modifier le profil » */
moiRouter.patch('/profil', async (req, res) => {
  const donnees = lire(profilSchema, req.body);
  if (req.utilisateur!.role !== 'ENSEIGNANT') delete donnees.specialite;
  const profil = await prisma.utilisateur.update({ where: { id: req.utilisateur!.id }, data: donnees, select: champsProfil });
  res.json({ profil });
});

/** PUT /api/moi/photo — photo de profil (multipart, champ « image ») */
moiRouter.put('/photo', receptionImage, async (req, res) => {
  const fichier = exigerImage(req.file);
  const ancienne = await prisma.utilisateur.findUniqueOrThrow({ where: { id: req.utilisateur!.id }, select: { photo: true } });
  await prisma.utilisateur.update({ where: { id: req.utilisateur!.id }, data: { photo: fichier.filename } });
  await supprimerImage(ancienne.photo);
  res.json({ photo: fichier.filename });
});

/** DELETE /api/moi/photo — retour aux initiales */
moiRouter.delete('/photo', async (req, res) => {
  const ancienne = await prisma.utilisateur.findUniqueOrThrow({ where: { id: req.utilisateur!.id }, select: { photo: true } });
  await prisma.utilisateur.update({ where: { id: req.utilisateur!.id }, data: { photo: null } });
  await supprimerImage(ancienne.photo);
  res.status(204).end();
});

const changementMotDePasseSchema = z
  .object({
    motDePasseActuel: z.string().min(1, 'Mot de passe actuel requis'),
    nouveauMotDePasse: motDePasseRobuste,
  })
  .refine((d) => d.motDePasseActuel !== d.nouveauMotDePasse, {
    path: ['nouveauMotDePasse'],
    message: 'Le nouveau mot de passe doit être différent de l’actuel',
  });

/**
 * PATCH /api/moi/mot-de-passe — cas d'utilisation « Modifier son mot de passe » (figure 2),
 * absent de la section 11. Lève aussi l'obligation de changer un mot de passe provisoire.
 */
moiRouter.patch('/mot-de-passe', async (req, res) => {
  const { motDePasseActuel, nouveauMotDePasse } = lire(changementMotDePasseSchema, req.body);
  const id = req.utilisateur!.id;

  const { motDePasseHache } = await prisma.utilisateur.findUniqueOrThrow({
    where: { id },
    select: { motDePasseHache: true },
  });
  if (!(await verifierMotDePasse(motDePasseActuel, motDePasseHache))) {
    throw new HttpError(400, 'Mot de passe actuel incorrect', 'MOT_DE_PASSE_INCORRECT', [
      { champ: 'motDePasseActuel', message: 'Mot de passe actuel incorrect' },
    ]);
  }

  await prisma.utilisateur.update({
    where: { id },
    data: { motDePasseHache: await hacherMotDePasse(nouveauMotDePasse), doitChangerMotDePasse: false },
  });
  res.status(204).end();
});
