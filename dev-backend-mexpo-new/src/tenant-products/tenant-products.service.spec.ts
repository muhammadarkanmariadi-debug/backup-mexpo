import { Test, TestingModule } from '@nestjs/testing';
import { TenantProductsService } from './tenant-products.service';

describe('TenantProductsService', () => {
  let service: TenantProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantProductsService],
    }).compile();

    service = module.get<TenantProductsService>(TenantProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
