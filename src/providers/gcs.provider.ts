import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StoreObjectDto } from '../storage/dto/store-object.dto';
import { StorageResult } from '../storage/interfaces/storage-result.interface';
import { StorageProvider } from './provider.interface';

@Injectable()
export class GcsProvider implements StorageProvider {
  readonly name = 'gcs';

  async store(payload: StoreObjectDto): Promise<StorageResult> {
    if (payload.objectKey.toLowerCase().includes('[fail-gcs]')) {
      throw new Error('GCS simulated failure.');
    }

    return {
      provider: this.name,
      status: 'stored',
      objectUrl: `https://gcs.mock.local/${encodeURIComponent(payload.objectKey)}`,
      etag: randomUUID(),
    };
  }
}
