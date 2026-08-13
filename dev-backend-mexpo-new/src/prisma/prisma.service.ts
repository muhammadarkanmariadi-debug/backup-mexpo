import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';
import { getDatabaseUrl, isMysqlDatabase } from '../helper/db-provider';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    const databaseUrl = getDatabaseUrl();
    if (!databaseUrl) {
      throw new Error(
        `DATABASE_URL is not set. Add a connection string (mysql:// or postgresql://) to .env, ` +
          `or set the individual DB_HOST/DB_USER/DB_PASSWORD/DB_NAME parameters`,
      );
    }
    const isMysql = isMysqlDatabase(
      configService.get<string>(`DATABASE_URL`),
      configService.get<string>(`DB_PROVIDER`),
    );
    super({
      adapter: isMysql
        ? new PrismaMariaDb(databaseUrl)
        : new PrismaPg({ connectionString: databaseUrl }),
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
