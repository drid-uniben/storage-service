import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageObject } from '@prisma/client';
import { PrismaService } from '../database/prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { StoreObjectDto } from './dto/store-object.dto';

@Injectable()
export class StorageService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  async queueStorage(
    accountId: string,
    payload: StoreObjectDto,
    requestId?: string,
  ): Promise<{ id: string; status: 'queued' }> {
    const storageObject = await this.prismaService.storageObject.create({
      data: {
        accountId,
        objectKey: payload.objectKey,
        sourceUrl: payload.sourceUrl,
        contentType: payload.contentType,
        sizeBytes: payload.sizeBytes,
        status: 'queued',
      },
    });

    await this.queueService.enqueueStorageJob({
      storageObjectId: storageObject.id,
      requestId,
    });

    return {
      id: storageObject.id,
      status: 'queued',
    };
  }

  async getStatus(accountId: string, objectId: string): Promise<StorageObject> {
    const object = await this.prismaService.storageObject.findFirst({
      where: {
        id: objectId,
        accountId,
      },
    });

    if (!object) {
      throw new NotFoundException('Storage object not found.');
    }

    return object;
  }
}
