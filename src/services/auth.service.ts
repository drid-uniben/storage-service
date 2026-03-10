import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { sha256 } from '../common/utils/hash.util';

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async createApiKey(
    accountName: string,
  ): Promise<{ accountId: string; apiKey: string }> {
    const account = await this.prisma.account.create({
      data: {
        name: accountName,
      },
    });

    const plaintextKey = randomBytes(24).toString('hex');
    const keyHash = sha256(plaintextKey);

    await this.prisma.apiKey.create({
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
  ): Promise<{ id: string; accountId: string } | null> {
    const keyHash = sha256(plaintextApiKey);
    return this.prisma.apiKey.findUnique({
      where: { keyHash },
      select: {
        id: true,
        accountId: true,
      },
    });
  }
}
