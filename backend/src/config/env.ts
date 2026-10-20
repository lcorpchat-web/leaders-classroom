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
} as const;
