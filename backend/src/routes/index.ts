import { Router } from 'express';
import { healthRouter } from './health.routes.js';

// Point de montage unique des routes de l'API (préfixe /api dans app.ts).
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
