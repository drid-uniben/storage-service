import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../database/prisma/prisma.module';
import { CloudinaryProvider } from '../providers/cloudinary.provider';
import { GcsProvider } from '../providers/gcs.provider';
import { ProviderFactory } from '../providers/provider.factory';
import { S3Provider } from '../providers/s3.provider';
import { STORAGE_PROVIDERS } from '../providers/provider.interface';
import { QueueModule } from '../queue/queue.module';
import { WebhookModule } from '../webhooks/webhook.module';
import { StorageController } from './storage.controller';
import { StorageProcessor } from './storage.processor';
import { StorageService } from './storage.service';

@Module({
  imports: [PrismaModule, QueueModule, AuthModule, WebhookModule],
  controllers: [StorageController],
  providers: [
    StorageService,
    StorageProcessor,
    S3Provider,
    CloudinaryProvider,
    GcsProvider,
    ProviderFactory,
    {
      provide: STORAGE_PROVIDERS,
      useFactory: (
        s3Provider: S3Provider,
        cloudinaryProvider: CloudinaryProvider,
        gcsProvider: GcsProvider,
      ) => [s3Provider, cloudinaryProvider, gcsProvider],
      inject: [S3Provider, CloudinaryProvider, GcsProvider],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
