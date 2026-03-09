import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDERS, StorageProvider } from './provider.interface';

@Injectable()
export class ProviderFactory {
  constructor(
    @Inject(STORAGE_PROVIDERS) private readonly providers: StorageProvider[],
    private readonly configService: ConfigService,
  ) {}

  getProvidersInOrder(): StorageProvider[] {
    const configuredOrder = this.configService
      .get<string>('storage.providerOrder', { infer: true })
      ?.split(',')
      .map((provider) => provider.trim().toLowerCase()) ?? [
      's3',
      'cloudinary',
      'gcs',
    ];

    const providerMap = new Map(
      this.providers.map((provider) => [provider.name.toLowerCase(), provider]),
    );
    const ordered = configuredOrder
      .map((name) => providerMap.get(name))
      .filter((provider): provider is StorageProvider => Boolean(provider));

    const leftovers = this.providers.filter(
      (provider) => !configuredOrder.includes(provider.name.toLowerCase()),
    );

    return [...ordered, ...leftovers];
  }
}
