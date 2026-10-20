import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  let database: 'ok' | 'indisponible' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'indisponible';
  }

  res.status(database === 'ok' ? 200 : 503).json({
    status: database === 'ok' ? 'ok' : 'degraded',
    service: 'leaders-classroom-api',
    database,
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
  });
});
