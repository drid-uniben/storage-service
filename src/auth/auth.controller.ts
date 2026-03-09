import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('keys')
  async createApiKey(
    @Body() dto: CreateApiKeyDto,
  ): Promise<{ accountId: string; apiKey: string }> {
    return this.authService.createApiKey(dto.accountName);
  }
}
