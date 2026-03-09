export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  auth: {
    apiKeyRateLimitPerMinute: Number(
      process.env.API_KEY_RATE_LIMIT_PER_MINUTE ?? 60,
    ),
  },
  storage: {
    providerOrder: process.env.PROVIDER_ORDER ?? 's3,cloudinary,gcs',
  },
});
