import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error';

export function errorHandlerMiddleware(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const errorPayload =
    error instanceof HttpError
      ? (error.details ?? error.message)
      : { message: 'Internal server error' };

  console.error(
    JSON.stringify({
      requestId: req.requestId ?? 'unknown',
      status: statusCode,
      path: req.originalUrl,
      method: req.method,
      error: errorPayload,
    }),
  );

  res.status(statusCode).json({
    statusCode,
    path: req.originalUrl,
    requestId: req.requestId,
    error: errorPayload,
    timestamp: new Date().toISOString(),
  });
}
