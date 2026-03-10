import { PrismaClient } from '@prisma/client';
import { hmacSha256 } from '../common/utils/hash.util';

export class WebhookService {
  constructor(private readonly prisma: PrismaClient) {}

  async registerEndpoint(accountId: string, url: string, secret: string) {
    return this.prisma.webhookEndpoint.create({
      data: {
        accountId,
        url,
        secret,
      },
    });
  }

  async emitStorageEvent(
    accountId: string,
    payload: {
      objectId: string;
      status: 'stored' | 'failed';
      objectPath?: string;
      failureReason?: string;
    },
  ): Promise<void> {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
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
