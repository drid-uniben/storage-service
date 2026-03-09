import { IsString, IsUrl } from 'class-validator';

export class RegisterWebhookDto {
  @IsUrl()
  url!: string;

  @IsString()
  secret!: string;
}
