import { Test, TestingModule } from '@nestjs/testing';
import { TenantTransactionsService } from './tenant-transactions.service';

describe('TenantTransactionsService', () => {
  let service: TenantTransactionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantTransactionsService],
    }).compile();

    service = module.get<TenantTransactionsService>(TenantTransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
