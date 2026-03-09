import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RegisterWebhookDto } from './dto/register-webhook.dto';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
@UseGuards(ApiKeyGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  async register(
    @CurrentAccount() accountId: string,
    @Body() dto: RegisterWebhookDto,
  ) {
    return this.webhookService.registerEndpoint(accountId, dto);
  }
}
