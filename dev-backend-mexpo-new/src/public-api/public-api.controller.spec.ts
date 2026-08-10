import { Test, TestingModule } from '@nestjs/testing';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';

describe('PublicApiController', () => {
  let controller: PublicApiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicApiController],
      providers: [PublicApiService],
    }).compile();

    controller = module.get<PublicApiController>(PublicApiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
