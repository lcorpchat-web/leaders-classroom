import 'dotenv/config';

const NODE_ENVS = ['development', 'production', 'test'] as const;
type NodeEnv = (typeof NODE_ENVS)[number];

function readNodeEnv(): NodeEnv {
  const value = process.env.NODE_ENV ?? 'development';
  if (!(NODE_ENVS as readonly string[]).includes(value)) {
    throw new Error(`NODE_ENV invalide : "${value}" (attendu : ${NODE_ENVS.join(', ')})`);
  }
  return value as NodeEnv;
}

function readPort(): number {
  const value = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`PORT invalide : "${process.env.PORT}"`);
  }
  return value;
}

function readCorsOrigins(): string[] {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function readRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name} (voir .env.example)`);
  }
  return value;
}

function readSecret(name: string, minLength = 32): string {
  const value = readRequired(name);
  if (value.length < minLength) {
    throw new Error(`${name} doit contenir au moins ${minLength} caractères`);
  }
  return value;
}

function readPositiveInt(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} invalide : "${process.env[name]}" (entier positif attendu)`);
  }
  return value;
}

const nodeEnv = readNodeEnv();

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: readPort(),
  corsOrigins: readCorsOrigins(),
  databaseUrl: readRequired('DATABASE_URL'),
  jwtSecret: readSecret('JWT_SECRET'),
  /** Durée d'une session standard (cookie de session, fermé avec le navigateur) */
  sessionDureeHeures: readPositiveInt('SESSION_DUREE_HEURES', 8),
  /** Durée d'une session « Se souvenir de moi » (cookie persistant) */
  sessionSouvenirJours: readPositiveInt('SESSION_SOUVENIR_JOURS', 30),
  /** Fuseau horaire de référence de l'Institut (messages et règles horaires côté serveur) */
  fuseauHoraire: process.env.FUSEAU_HORAIRE ?? 'Africa/Douala',
  /** Adresse publique de l'application (retour de BigBlueButton, URL de rappel de fin de séance) */
  appUrl: (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  bbb: {
    /** Ex. https://bbb.exemple.com/bigbluebutton/ — vide : mode simulation (développement uniquement) */
    url: (process.env.BBB_URL ?? '').replace(/\/?$/, '/').replace(/^\/$/, ''),
    secret: process.env.BBB_SECRET ?? '',
    algorithme: (process.env.BBB_CHECKSUM ?? 'sha256') as 'sha1' | 'sha256',
  },
  supports: {
    /** Dossier de stockage des supports (figure 13 : uploads/), jamais servi directement */
    dossier: process.env.UPLOADS_DIR ?? 'uploads',
    tailleMaxMo: readPositiveInt('SUPPORT_TAILLE_MAX_MO', 25),
  },
  presence: {
    /** Arrivée au-delà de ce délai après le début : RETARD */
    retardMinutes: readPositiveInt('PRESENCE_RETARD_MINUTES', 10),
    /** Durée cumulée inférieure à ce pourcentage de la séance : ABSENT */
    dureeMinPourcent: readPositiveInt('PRESENCE_DUREE_MIN_POURCENT', 50),
  },
} as const;
