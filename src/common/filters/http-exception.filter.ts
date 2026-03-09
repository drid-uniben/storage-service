import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<{
      status: (code: number) => { json: (payload: unknown) => void };
    }>();
    const request = context.getRequest<{
      url: string;
      method: string;
      requestId?: string;
    }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorPayload =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    console.error(
      JSON.stringify({
        requestId: request.requestId ?? 'unknown',
        status,
        path: request.url,
        method: request.method,
        error: errorPayload,
      }),
    );

    response.status(status).json({
      statusCode: status,
      path: request.url,
      requestId: request.requestId,
      error: errorPayload,
      timestamp: new Date().toISOString(),
    });
  }
}
