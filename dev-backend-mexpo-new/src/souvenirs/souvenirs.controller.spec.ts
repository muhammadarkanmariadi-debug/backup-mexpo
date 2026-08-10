import { Test, TestingModule } from '@nestjs/testing';
import { SouvenirsController } from './souvenirs.controller';
import { SouvenirsService } from './souvenirs.service';

describe('SouvenirsController', () => {
  let controller: SouvenirsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SouvenirsController],
      providers: [SouvenirsService],
    }).compile();

    controller = module.get<SouvenirsController>(SouvenirsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
