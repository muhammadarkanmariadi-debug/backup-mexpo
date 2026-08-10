import { Test, TestingModule } from '@nestjs/testing';
import { TenantCategoriesService } from './tenant-categories.service';

describe('TenantCategoriesService', () => {
  let service: TenantCategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantCategoriesService],
    }).compile();

    service = module.get<TenantCategoriesService>(TenantCategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
