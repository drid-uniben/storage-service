import { RequestHandler, Router } from 'express';
import { asyncRoute } from '../middleware/async-route';
import { HttpError } from '../errors/http-error';
import { WebhookService } from '../services/webhook.service';

function parseUrl(value: string, fieldName: string): string {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new HttpError(400, `${fieldName} must be a valid URL.`);
  }
}

export function createWebhooksRouter(
  webhookService: WebhookService,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.post(
    '/',
    authMiddleware,
    asyncRoute(async (req, res) => {
      const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
      const secret =
        typeof req.body?.secret === 'string' ? req.body.secret.trim() : '';

      parseUrl(url, 'url');
      if (!secret) {
        throw new HttpError(
          400,
          'Validation failed.',
          'secret must be a string.',
        );
      }

      const endpoint = await webhookService.registerEndpoint(
        req.accountId as string,
        url,
        secret,
      );

      res.status(201).json(endpoint);
    }),
  );

  return router;
}
