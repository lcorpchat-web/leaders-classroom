import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { classesRouter } from '../modules/classes/classes.routes.js';
import { moiRouter } from '../modules/moi/moi.routes.js';
import { presencesRouter } from '../modules/presences/presences.routes.js';
import { bbbRouter } from '../modules/salle/bbb.routes.js';
import { seancesRouter } from '../modules/seances/seances.routes.js';
import { supportsRouter } from '../modules/supports/supports.routes.js';
import { utilisateursRouter } from '../modules/utilisateurs/utilisateurs.routes.js';
import { healthRouter } from './health.routes.js';
import { rechercheRouter } from './recherche.routes.js';

// Point de montage unique des routes de l'API (préfixe /api dans app.ts).
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/moi', moiRouter);
apiRouter.use('/utilisateurs', utilisateursRouter);
apiRouter.use('/classes', classesRouter);
apiRouter.use('/seances', seancesRouter);
apiRouter.use('/bbb', bbbRouter);
apiRouter.use('/supports', supportsRouter);
apiRouter.use('/presences', presencesRouter);
apiRouter.use('/recherche', rechercheRouter);
