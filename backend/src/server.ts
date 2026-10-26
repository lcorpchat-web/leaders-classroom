import { createApp } from './app.js';
import { env } from './config/env.js';
import { bbbConfigure, bbbSimulation } from './lib/bigbluebutton.js';
import { cloturerSeancesDepassees } from './modules/salle/salle.service.js';

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`API Leaders Classroom démarrée sur http://localhost:${env.port} (${env.nodeEnv})`);
  if (bbbSimulation) console.log('BigBlueButton non configuré : salles virtuelles en mode simulation');
  else if (!bbbConfigure) console.warn('ATTENTION : BigBlueButton non configuré (BBB_URL, BBB_SECRET)');
});

// Toutes les 5 minutes : clôture des séances restées ouvertes après leur fin
const clotures = setInterval(() => {
  cloturerSeancesDepassees().catch((err: unknown) => console.error('Clôture automatique des séances :', err));
}, 5 * 60_000);

function shutdown(signal: string): void {
  console.log(`${signal} reçu, arrêt du serveur...`);
  clearInterval(clotures);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
