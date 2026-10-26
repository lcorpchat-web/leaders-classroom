import { Router } from 'express';
import { z } from 'zod';
import { authentifier } from '../../middlewares/authentifier.js';
import { lire } from '../../utils/lire.js';
import { idParams } from '../../utils/schemas.js';
import { fichierSupport, supprimerSupport } from './supports.service.js';

/** Supports de cours : téléchargement contrôlé et retrait. Le dépôt est sous /api/classes/:id/supports. */
export const supportsRouter = Router();

supportsRouter.use(authentifier);

const fichierQuery = z.object({ apercu: z.enum(['1']).optional() });

/** GET /api/supports/:id/fichier?apercu=1 — téléchargement (ou affichage pour PDF, images, audio, vidéo) */
supportsRouter.get('/:id/fichier', async (req, res) => {
  const { id } = lire(idParams, req.params);
  const { apercu } = lire(fichierQuery, req.query);
  const { chemin, nomFichier, typeMime, apercuPossible } = await fichierSupport(req.utilisateur!, id);

  res.setHeader('Cache-Control', 'private, no-store');
  if (apercu && apercuPossible) {
    res.type(typeMime);
    res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(nomFichier)}`);
    res.sendFile(chemin);
    return;
  }
  res.download(chemin, nomFichier, { headers: { 'Content-Type': typeMime } });
});

/** DELETE /api/supports/:id */
supportsRouter.delete('/:id', async (req, res) => {
  const { id } = lire(idParams, req.params);
  await supprimerSupport(req.utilisateur!, id);
  res.status(204).end();
});
