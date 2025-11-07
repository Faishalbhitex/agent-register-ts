import 'dotenv/config';

interface EnvConfig {
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    uri: string;
  };
  redis: {
    url: string;
  },
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required enviroment variable: ${key}`);
  }
  return value;
}

export const env: EnvConfig = {
  db: {
    host: getEnvVar('DB_HOST', 'localhost'),
    port: parseInt(getEnvVar('DB_PORT', '5432')),
    name: getEnvVar('DB_NAME'),
    user: getEnvVar('DB_USER'),
    password: getEnvVar('DB_PASSWORD', 'none'),
    uri: getEnvVar('DB_URI'),
  },
  redis: {
    url: getEnvVar('REDIS_URL'),
  },
  jwt: {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '15m') as string,
    refreshSecret: getEnvVar('JWT_REFRESH_SECRET'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d') as string,

  },
  server: {
    port: parseInt(getEnvVar('PORT', '3000'), 10),
    nodeEnv: getEnvVar('NODE_ENV', 'development'),
  },
}
