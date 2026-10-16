import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'leaders-classroom-api',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});
