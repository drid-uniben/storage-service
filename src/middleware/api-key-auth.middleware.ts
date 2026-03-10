import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { InMemoryRateLimiter } from '../services/rate-limiter.service';
import { HttpError } from '../errors/http-error';

export function createApiKeyAuthMiddleware(
  authService: AuthService,
  rateLimiter: InMemoryRateLimiter,
  maxPerMinute: number,
) {
  return async function apiKeyAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const rawApiKey = req.header('x-api-key');
    if (!rawApiKey) {
      next(new HttpError(401, 'Missing x-api-key header.'));
      return;
    }

    try {
      const apiKeyRecord = await authService.validateApiKey(rawApiKey);
      if (!apiKeyRecord) {
        next(new HttpError(401, 'Invalid API key.'));
        return;
      }

      const allowed = rateLimiter.isAllowed(apiKeyRecord.id, maxPerMinute);
      if (!allowed) {
        next(new HttpError(429, 'Rate limit exceeded for API key.'));
        return;
      }

      req.accountId = apiKeyRecord.accountId;
      req.apiKeyId = apiKeyRecord.id;
      next();
    } catch (error) {
      next(error);
    }
  };
}
