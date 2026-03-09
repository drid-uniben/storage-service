type EnvConfig = Record<string, unknown>;

export function validate(config: EnvConfig): EnvConfig {
  const requiredVars = ['DATABASE_URL', 'REDIS_URL'];
  for (const variable of requiredVars) {
    if (!config[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }

  const port = Number(config.PORT ?? 3000);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error('PORT must be a positive number.');
  }

  const rateLimit = Number(config.API_KEY_RATE_LIMIT_PER_MINUTE ?? 60);
  if (Number.isNaN(rateLimit) || rateLimit <= 0) {
    throw new Error('API_KEY_RATE_LIMIT_PER_MINUTE must be a positive number.');
  }

  return {
    ...config,
    PORT: port,
    API_KEY_RATE_LIMIT_PER_MINUTE: rateLimit,
  };
}
