import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{
      method: string;
      url: string;
      headers: Record<string, string | undefined>;
      requestId?: string;
    }>();
    const response = http.getResponse<{
      setHeader: (key: string, value: string) => void;
      statusCode: number;
    }>();

    const requestId = request.headers['x-request-id'] ?? randomUUID();
    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const start = Date.now();

    return next.handle().pipe(
      finalize(() => {
        const latencyMs = Date.now() - start;
        console.log(
          JSON.stringify({
            requestId,
            method: request.method,
            path: request.url,
            status: response.statusCode,
            latencyMs,
          }),
        );
      }),
    );
  }
}
