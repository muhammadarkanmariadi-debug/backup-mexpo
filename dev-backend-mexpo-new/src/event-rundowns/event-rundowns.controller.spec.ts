import { Test, TestingModule } from '@nestjs/testing';
import { EventRundownsController } from './event-rundowns.controller';
import { EventRundownsService } from './event-rundowns.service';

describe('EventRundownsController', () => {
  let controller: EventRundownsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventRundownsController],
      providers: [EventRundownsService],
    }).compile();

    controller = module.get<EventRundownsController>(EventRundownsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
