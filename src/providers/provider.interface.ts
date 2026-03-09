import { StoreObjectDto } from '../storage/dto/store-object.dto';
import { StorageResult } from '../storage/interfaces/storage-result.interface';

export const STORAGE_PROVIDERS = 'STORAGE_PROVIDERS';

export interface StorageProvider {
  readonly name: string;
  store(payload: StoreObjectDto): Promise<StorageResult>;
}
