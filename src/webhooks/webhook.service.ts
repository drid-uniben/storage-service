import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { hmacSha256 } from '../common/utils/hash.util';
import { RegisterWebhookDto } from './dto/register-webhook.dto';

@Injectable()
export class WebhookService {
  constructor(private readonly prismaService: PrismaService) {}

  async registerEndpoint(accountId: string, dto: RegisterWebhookDto) {
    return this.prismaService.webhookEndpoint.create({
      data: {
        accountId,
        url: dto.url,
        secret: dto.secret,
      },
    });
  }

  async emitStorageEvent(
    accountId: string,
    payload: {
      objectId: string;
      status: 'stored' | 'failed';
      provider?: string;
      objectUrl?: string;
    },
  ): Promise<void> {
    const endpoints = await this.prismaService.webhookEndpoint.findMany({
      where: { accountId },
    });

    if (endpoints.length === 0) {
      return;
    }

    const body = JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString(),
    });

    await Promise.all(
      endpoints.map(async (endpoint) => {
        const signature = hmacSha256(endpoint.secret, body);
        try {
          await fetch(endpoint.url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-webhook-signature': signature,
            },
            body,
          });
        } catch (error) {
          const reason =
            error instanceof Error
              ? error.message
              : 'Unknown webhook dispatch error';
          console.error(
            JSON.stringify({
              endpoint: endpoint.url,
              status: 'failed',
              failureReason: reason,
            }),
          );
        }
      }),
    );
  }
}
