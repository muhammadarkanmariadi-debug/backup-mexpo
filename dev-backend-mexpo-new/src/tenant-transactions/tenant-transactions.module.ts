import { Module } from '@nestjs/common';
import { TenantTransactionsService } from './tenant-transactions.service';
import { TenantTransactionsController } from './tenant-transactions.controller';

@Module({
  controllers: [TenantTransactionsController],
  providers: [TenantTransactionsService],
})
export class TenantTransactionsModule {}
