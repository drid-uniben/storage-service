import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { asyncRoute } from '../middleware/async-route';
import { HttpError } from '../errors/http-error';

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post(
    '/keys',
    asyncRoute(async (req, res) => {
      const accountName =
        typeof req.body?.accountName === 'string'
          ? req.body.accountName.trim()
          : '';

      if (accountName.length < 2) {
        throw new HttpError(
          400,
          'Validation failed.',
          'accountName must be a string with at least 2 characters.',
        );
      }

      const result = await authService.createApiKey(accountName);
      res.status(201).json(result);
    }),
  );

  return router;
}
