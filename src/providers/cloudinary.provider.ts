import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StoreObjectDto } from '../storage/dto/store-object.dto';
import { StorageResult } from '../storage/interfaces/storage-result.interface';
import { StorageProvider } from './provider.interface';

@Injectable()
export class CloudinaryProvider implements StorageProvider {
  readonly name = 'cloudinary';

  async store(payload: StoreObjectDto): Promise<StorageResult> {
    if (payload.objectKey.toLowerCase().includes('[fail-cloudinary]')) {
      throw new Error('Cloudinary simulated failure.');
    }

    return {
      provider: this.name,
      status: 'stored',
      objectUrl: `https://cloudinary.mock.local/${encodeURIComponent(payload.objectKey)}`,
      etag: randomUUID(),
    };
  }
}
