import { Test, TestingModule } from '@nestjs/testing';
import { TenantTransactionsController } from './tenant-transactions.controller';
import { TenantTransactionsService } from './tenant-transactions.service';

describe('TenantTransactionsController', () => {
  let controller: TenantTransactionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantTransactionsController],
      providers: [TenantTransactionsService],
    }).compile();

    controller = module.get<TenantTransactionsController>(
      TenantTransactionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
