import { RequestHandler, Router } from 'express';
import { asyncRoute } from '../middleware/async-route';
import { HttpError } from '../errors/http-error';
import { StorageService } from '../services/storage.service';

function parseUrl(value: string, fieldName: string): string {
  try {
    const url = new URL(value);
    return url.toString();
  } catch {
    throw new HttpError(400, `${fieldName} must be a valid URL.`);
  }
}

export function createObjectsRouter(
  storageService: StorageService,
  authMiddleware: RequestHandler,
): Router {
  const router = Router();

  router.post(
    '/store',
    authMiddleware,
    asyncRoute(async (req, res) => {
      const objectKey =
        typeof req.body?.objectKey === 'string'
          ? req.body.objectKey.trim()
          : '';
      const sourceUrl =
        typeof req.body?.sourceUrl === 'string'
          ? req.body.sourceUrl.trim()
          : '';
      const contentType =
        typeof req.body?.contentType === 'string' &&
        req.body.contentType.trim().length > 0
          ? req.body.contentType.trim()
          : undefined;
      const sizeBytesValue = req.body?.sizeBytes;
      const sizeBytes =
        typeof sizeBytesValue === 'number' && Number.isInteger(sizeBytesValue)
          ? sizeBytesValue
          : undefined;

      if (!objectKey) {
        throw new HttpError(
          400,
          'Validation failed.',
          'objectKey must be a string.',
        );
      }

      parseUrl(sourceUrl, 'sourceUrl');

      if (sizeBytes !== undefined && sizeBytes < 1) {
        throw new HttpError(
          400,
          'Validation failed.',
          'sizeBytes must be an integer greater than or equal to 1.',
        );
      }

      const result = await storageService.queueStorage(
        req.accountId as string,
        {
          objectKey,
          sourceUrl,
          contentType,
          sizeBytes,
        },
        req.requestId,
      );

      res.status(202).json(result);
    }),
  );

  router.get(
    '/:id',
    authMiddleware,
    asyncRoute(async (req, res) => {
      const object = await storageService.getStatus(
        req.accountId as string,
        String(req.params.id),
      );
      res.status(200).json(object);
    }),
  );

  return router;
}
