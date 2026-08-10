import { Test, TestingModule } from '@nestjs/testing';
import { SouvenirsService } from './souvenirs.service';

describe('SouvenirsService', () => {
  let service: SouvenirsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SouvenirsService],
    }).compile();

    service = module.get<SouvenirsService>(SouvenirsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
