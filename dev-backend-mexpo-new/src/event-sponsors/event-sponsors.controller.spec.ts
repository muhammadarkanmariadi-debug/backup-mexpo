import { Test, TestingModule } from '@nestjs/testing';
import { EventSponsorsController } from './event-sponsors.controller';
import { EventSponsorsService } from './event-sponsors.service';

describe('EventSponsorsController', () => {
  let controller: EventSponsorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventSponsorsController],
      providers: [EventSponsorsService],
    }).compile();

    controller = module.get<EventSponsorsController>(EventSponsorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
