import { Test, TestingModule } from '@nestjs/testing';
import { TenantProductsController } from './tenant-products.controller';
import { TenantProductsService } from './tenant-products.service';

describe('TenantProductsController', () => {
  let controller: TenantProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantProductsController],
      providers: [TenantProductsService],
    }).compile();

    controller = module.get<TenantProductsController>(TenantProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
