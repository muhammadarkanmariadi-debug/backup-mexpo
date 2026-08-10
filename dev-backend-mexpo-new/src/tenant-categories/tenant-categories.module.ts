import { Module } from '@nestjs/common';
import { TenantCategoriesService } from './tenant-categories.service';
import { TenantCategoriesController } from './tenant-categories.controller';

@Module({
  controllers: [TenantCategoriesController],
  providers: [TenantCategoriesService],
})
export class TenantCategoriesModule {}
