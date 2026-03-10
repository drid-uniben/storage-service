import { PrismaClient, StorageObject } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { HttpError } from '../errors/http-error';
import { WebhookService } from './webhook.service';
import { resolveStoragePath } from '../utils/storage-path.util';

export interface StoreObjectPayload {
  objectKey: string;
  sourceUrl: string;
  contentType?: string;
  sizeBytes?: number;
}

export class StorageService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly webhookService: WebhookService,
    private readonly storageRoot: string,
  ) {}

  async queueStorage(
    accountId: string,
    payload: StoreObjectPayload,
    requestId?: string,
  ): Promise<{ id: string; status: 'queued' }> {
    const storageObject = await this.prisma.storageObject.create({
      data: {
        accountId,
        objectKey: payload.objectKey,
        sourceUrl: payload.sourceUrl,
        contentType: payload.contentType,
        sizeBytes: payload.sizeBytes,
        status: 'queued',
      },
    });

    setImmediate(() => {
      void this.processStorageObject(storageObject.id, requestId);
    });

    return {
      id: storageObject.id,
      status: 'queued',
    };
  }

  async getStatus(accountId: string, objectId: string): Promise<StorageObject> {
    const object = await this.prisma.storageObject.findFirst({
      where: {
        id: objectId,
        accountId,
      },
    });

    if (!object) {
      throw new HttpError(404, 'Storage object not found.');
    }

    return object;
  }

  private async processStorageObject(
    storageObjectId: string,
    requestId?: string,
  ): Promise<void> {
    const storageObject = await this.prisma.storageObject.findUnique({
      where: { id: storageObjectId },
    });

    if (!storageObject) {
      return;
    }

    try {
      const response = await fetch(storageObject.sourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch source: HTTP ${response.status}`);
      }

      const data = Buffer.from(await response.arrayBuffer());
      const { absolutePath, relativePath } = resolveStoragePath(
        this.storageRoot,
        storageObject.accountId,
        storageObject.objectKey,
      );

      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, data);

      await this.prisma.providerAttempt.create({
        data: {
          storageObjectId: storageObject.id,
          provider: 'vps-disk',
          status: 'stored',
        },
      });

      await this.prisma.storageObject.update({
        where: { id: storageObject.id },
        data: {
          status: 'stored',
          providerUsed: 'vps-disk',
          storedUrl: relativePath,
        },
      });

      console.log(
        JSON.stringify({
          requestId,
          provider: 'vps-disk',
          status: 'stored',
          storageObjectId: storageObject.id,
        }),
      );

      await this.webhookService.emitStorageEvent(storageObject.accountId, {
        objectId: storageObject.id,
        status: 'stored',
        objectPath: relativePath,
      });
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : 'Unknown storage failure';

      await this.prisma.providerAttempt.create({
        data: {
          storageObjectId: storageObject.id,
          provider: 'vps-disk',
          status: 'failed',
          errorMessage: failureReason,
        },
      });

      await this.prisma.storageObject.update({
        where: { id: storageObject.id },
        data: {
          status: 'failed',
          providerUsed: 'vps-disk',
        },
      });

      console.error(
        JSON.stringify({
          requestId,
          provider: 'vps-disk',
          status: 'failed',
          storageObjectId: storageObject.id,
          failureReason,
        }),
      );

      await this.webhookService.emitStorageEvent(storageObject.accountId, {
        objectId: storageObject.id,
        status: 'failed',
        failureReason,
      });
    }
  }
}
