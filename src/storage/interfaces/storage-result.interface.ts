export interface StorageResult {
  provider: string;
  status: 'stored' | 'failed';
  objectUrl?: string;
  etag?: string;
  errorMessage?: string;
}
