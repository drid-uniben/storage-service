import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { StoreObjectDto } from './dto/store-object.dto';
import { StorageService } from './storage.service';

@Controller('objects')
@UseGuards(ApiKeyGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('store')
  async store(
    @CurrentAccount() accountId: string,
    @Body() payload: StoreObjectDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<{ id: string; status: 'queued' }> {
    return this.storageService.queueStorage(accountId, payload, requestId);
  }

  @Get(':id')
  async getStatus(
    @CurrentAccount() accountId: string,
    @Param('id') objectId: string,
  ) {
    return this.storageService.getStatus(accountId, objectId);
  }
}
