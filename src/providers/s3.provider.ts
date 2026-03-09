import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StoreObjectDto } from '../storage/dto/store-object.dto';
import { StorageResult } from '../storage/interfaces/storage-result.interface';
import { StorageProvider } from './provider.interface';

@Injectable()
export class S3Provider implements StorageProvider {
  readonly name = 's3';

  async store(payload: StoreObjectDto): Promise<StorageResult> {
    if (payload.objectKey.toLowerCase().includes('[fail-s3]')) {
      throw new Error('S3 simulated failure.');
    }

    return {
      provider: this.name,
      status: 'stored',
      objectUrl: `https://s3.mock.local/${encodeURIComponent(payload.objectKey)}`,
      etag: randomUUID(),
    };
  }
}
