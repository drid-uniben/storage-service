import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export function requestContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingRequestId = req.header('x-request-id');
  const requestId =
    typeof incomingRequestId === 'string' && incomingRequestId.length > 0
      ? incomingRequestId
      : randomUUID();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const latencyMs = Date.now() - start;
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        latencyMs,
      }),
    );
  });

  next();
}
