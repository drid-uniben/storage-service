import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { PrismaModule } from './database/prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { WebhookModule } from './webhooks/webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),
    PrismaModule,
    QueueModule,
    AuthModule,
    StorageModule,
    WebhookModule,
  ],
})
export class AppModule {}
