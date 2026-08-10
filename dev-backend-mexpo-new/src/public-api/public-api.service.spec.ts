import { Test, TestingModule } from '@nestjs/testing';
import { PublicApiService } from './public-api.service';

describe('PublicApiService', () => {
  let service: PublicApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicApiService],
    }).compile();

    service = module.get<PublicApiService>(PublicApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
