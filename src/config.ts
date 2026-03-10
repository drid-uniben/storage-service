export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  storageRoot: string;
  apiKeyRateLimitPerMinute: number;
}

export function loadConfig(): AppConfig {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }

  const port = Number(process.env.PORT ?? 3000);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT must be a positive number.');
  }

  const apiKeyRateLimitPerMinute = Number(
    process.env.API_KEY_RATE_LIMIT_PER_MINUTE ?? 60,
  );
  if (Number.isNaN(apiKeyRateLimitPerMinute) || apiKeyRateLimitPerMinute < 0) {
    throw new Error('API_KEY_RATE_LIMIT_PER_MINUTE must be 0 or greater.');
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
    databaseUrl,
    storageRoot: process.env.STORAGE_ROOT ?? '/data/storage',
    apiKeyRateLimitPerMinute,
  };
}
