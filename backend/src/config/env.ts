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

export const env = {
  nodeEnv: readNodeEnv(),
  port: readPort(),
  corsOrigins: readCorsOrigins(),
  databaseUrl: readRequired('DATABASE_URL'),
  isProduction: process.env.NODE_ENV === 'production',
} as const;
