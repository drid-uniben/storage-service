import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      accountId?: string;
      apiKeyId?: string;
    }>();

    const rawApiKey = request.headers['x-api-key'];
    if (!rawApiKey) {
      throw new UnauthorizedException('Missing x-api-key header.');
    }

    const apiKeyRecord = await this.authService.validateApiKey(rawApiKey);
    if (!apiKeyRecord) {
      throw new UnauthorizedException('Invalid API key.');
    }

    const limit = this.configService.get<number>(
      'auth.apiKeyRateLimitPerMinute',
      {
        infer: true,
      },
    ) as number;
    const redis = this.queueService.getRedisClient();
    const minuteBucket = Math.floor(Date.now() / 60000);
    const key = `rate-limit:${apiKeyRecord.id}:${minuteBucket}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60);
    }

    if (count > limit) {
      throw new HttpException(
        'Rate limit exceeded for API key.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    request.accountId = apiKeyRecord.accountId;
    request.apiKeyId = apiKeyRecord.id;
    return true;
  }
}
