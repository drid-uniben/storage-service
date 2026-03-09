import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import { PrismaService } from '../database/prisma/prisma.service';
import { ProviderFactory } from '../providers/provider.factory';
import { QueueService } from '../queue/queue.service';
import { WebhookService } from '../webhooks/webhook.service';
import { StorageJobData } from './interfaces/storage-job.interface';

@Injectable()
export class StorageProcessor implements OnModuleInit, OnModuleDestroy {
  private worker?: Worker<StorageJobData>;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly providerFactory: ProviderFactory,
    private readonly queueService: QueueService,
    private readonly webhookService: WebhookService,
  ) {}

  onModuleInit(): void {
    this.worker = this.queueService.createWorker(
      this.handleStorageJob.bind(this),
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async handleStorageJob(job: Job<StorageJobData>): Promise<void> {
    const { storageObjectId, requestId } = job.data;

    const storageObject = await this.prismaService.storageObject.findUnique({
      where: { id: storageObjectId },
    });

    if (!storageObject) {
      throw new Error(`Storage object not found for job ${storageObjectId}`);
    }

    const providers = this.providerFactory.getProvidersInOrder();

    for (const provider of providers) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const start = Date.now();

        try {
          const result = await provider.store({
            objectKey: storageObject.objectKey,
            sourceUrl: storageObject.sourceUrl,
            contentType: storageObject.contentType ?? undefined,
            sizeBytes: storageObject.sizeBytes ?? undefined,
          });

          const latencyMs = Date.now() - start;
          await this.prismaService.providerAttempt.create({
            data: {
              storageObjectId: storageObject.id,
              provider: provider.name,
              status: 'stored',
            },
          });

          await this.prismaService.storageObject.update({
            where: { id: storageObject.id },
            data: {
              status: 'stored',
              providerUsed: result.provider,
              storedUrl: result.objectUrl,
            },
          });

          console.log(
            JSON.stringify({
              requestId,
              provider: provider.name,
              status: 'stored',
              latencyMs,
              failureReason: null,
            }),
          );

          await this.webhookService.emitStorageEvent(storageObject.accountId, {
            objectId: storageObject.id,
            status: 'stored',
            provider: result.provider,
            objectUrl: result.objectUrl,
          });

          return;
        } catch (error) {
          const latencyMs = Date.now() - start;
          const failureReason =
            error instanceof Error ? error.message : 'Unknown provider failure';

          await this.prismaService.providerAttempt.create({
            data: {
              storageObjectId: storageObject.id,
              provider: provider.name,
              status: 'failed',
              errorMessage: failureReason,
            },
          });

          console.error(
            JSON.stringify({
              requestId,
              provider: provider.name,
              status: 'failed',
              latencyMs,
              failureReason,
              attempt,
            }),
          );
        }
      }
    }

    await this.prismaService.storageObject.update({
      where: { id: storageObject.id },
      data: {
        status: 'failed',
      },
    });

    await this.webhookService.emitStorageEvent(storageObject.accountId, {
      objectId: storageObject.id,
      status: 'failed',
    });
  }
}
