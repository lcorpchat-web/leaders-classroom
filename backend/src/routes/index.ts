import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes.js';
import { moiRouter } from '../modules/moi/moi.routes.js';
import { healthRouter } from './health.routes.js';

// Point de montage unique des routes de l'API (préfixe /api dans app.ts).
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/moi', moiRouter);
