import { Module } from '@nestjs/common';
import { TenantProductsService } from './tenant-products.service';
import { TenantProductsController } from './tenant-products.controller';

@Module({
  controllers: [TenantProductsController],
  providers: [TenantProductsService],
})
export class TenantProductsModule {}
