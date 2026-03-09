import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Processor, Queue, Worker } from 'bullmq';
import IORedis, { RedisOptions } from 'ioredis';
import { STORAGE_QUEUE_NAME } from './queue.constants';

export interface StorageQueuePayload {
  storageObjectId: string;
  requestId?: string;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly redisClient: IORedis;
  private readonly queue: Queue<StorageQueuePayload>;
  private readonly connection: RedisOptions;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('redis.url', {
      infer: true,
    }) as string;
    const url = new URL(redisUrl);

    this.connection = {
      host: url.hostname,
      port: Number(url.port || 6379),
      username: url.username || undefined,
      password: url.password || undefined,
      db: url.pathname ? Number(url.pathname.replace('/', '')) || 0 : 0,
      maxRetriesPerRequest: null,
    };

    this.redisClient = new IORedis(redisUrl, { maxRetriesPerRequest: null });
    this.queue = new Queue<StorageQueuePayload>(STORAGE_QUEUE_NAME, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });
  }

  async enqueueStorageJob(payload: StorageQueuePayload): Promise<void> {
    await this.queue.add('store-object', payload);
  }

  createWorker(
    processor: Processor<StorageQueuePayload, void, string>,
  ): Worker<StorageQueuePayload> {
    return new Worker<StorageQueuePayload>(STORAGE_QUEUE_NAME, processor, {
      connection: this.connection,
      concurrency: 5,
    });
  }

  getRedisClient(): IORedis {
    return this.redisClient;
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.redisClient.quit();
  }
}
