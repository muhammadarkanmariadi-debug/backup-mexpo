import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>(`DATABASE_URL`);
    if (!databaseUrl) {
      throw new Error(
        `DATABASE_URL is not set. Add a Supabase (postgresql://) connection string to .env`,
      );
    }
    super({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
