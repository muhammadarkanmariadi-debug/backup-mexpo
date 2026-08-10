import { Test, TestingModule } from '@nestjs/testing';
import { TenantCategoriesController } from './tenant-categories.controller';
import { TenantCategoriesService } from './tenant-categories.service';

describe('TenantCategoriesController', () => {
  let controller: TenantCategoriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantCategoriesController],
      providers: [TenantCategoriesService],
    }).compile();

    controller = module.get<TenantCategoriesController>(
      TenantCategoriesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
