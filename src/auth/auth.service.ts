import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ApiKey } from '@prisma/client';
import { sha256 } from '../common/utils/hash.util';
import { PrismaService } from '../database/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prismaService: PrismaService) {}

  async createApiKey(
    accountName: string,
  ): Promise<{ accountId: string; apiKey: string }> {
    const account = await this.prismaService.account.create({
      data: {
        name: accountName,
      },
    });

    const plaintextKey = randomBytes(24).toString('hex');
    const keyHash = sha256(plaintextKey);

    await this.prismaService.apiKey.create({
      data: {
        keyHash,
        accountId: account.id,
      },
    });

    return {
      accountId: account.id,
      apiKey: plaintextKey,
    };
  }

  async validateApiKey(
    plaintextApiKey: string,
  ): Promise<(ApiKey & { accountId: string }) | null> {
    const keyHash = sha256(plaintextApiKey);
    return this.prismaService.apiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        keyHash: true,
        accountId: true,
        createdAt: true,
      },
    });
  }
}
