import express from 'express';
import { PrismaClient } from '@prisma/client';
import { loadConfig } from './config';
import { requestContextMiddleware } from './middleware/request-context.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { createApiKeyAuthMiddleware } from './middleware/api-key-auth.middleware';
import { InMemoryRateLimiter } from './services/rate-limiter.service';
import { AuthService } from './services/auth.service';
import { StorageService } from './services/storage.service';
import { WebhookService } from './services/webhook.service';
import { createAuthRouter } from './routes/auth.routes';
import { createObjectsRouter } from './routes/objects.routes';
import { createWebhooksRouter } from './routes/webhooks.routes';

export interface AppContext {
  app: ReturnType<typeof express>;
  prisma: PrismaClient;
  config: ReturnType<typeof loadConfig>;
}

export async function createApp(): Promise<AppContext> {
  const config = loadConfig();
  const prisma = new PrismaClient();
  await prisma.$connect();

  const authService = new AuthService(prisma);
  const webhookService = new WebhookService(prisma);
  const storageService = new StorageService(
    prisma,
    webhookService,
    config.storageRoot,
  );
  const rateLimiter = new InMemoryRateLimiter();
  const authMiddleware = createApiKeyAuthMiddleware(
    authService,
    rateLimiter,
    config.apiKeyRateLimitPerMinute,
  );

  const app = express();
  app.use(express.json({ limit: '10mb' }));
  app.use(requestContextMiddleware);

  app.use('/auth', createAuthRouter(authService));
  app.use('/objects', createObjectsRouter(storageService, authMiddleware));
  app.use('/webhooks', createWebhooksRouter(webhookService, authMiddleware));

  app.use(errorHandlerMiddleware);

  return { app, prisma, config };
}
