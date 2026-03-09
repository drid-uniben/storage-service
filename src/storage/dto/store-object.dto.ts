import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class StoreObjectDto {
  @IsString()
  objectKey!: string;

  @IsUrl()
  sourceUrl!: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sizeBytes?: number;
}
