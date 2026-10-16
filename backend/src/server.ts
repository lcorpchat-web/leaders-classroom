import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`API Leaders Classroom démarrée sur http://localhost:${env.port} (${env.nodeEnv})`);
});

function shutdown(signal: string): void {
  console.log(`${signal} reçu, arrêt du serveur...`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
