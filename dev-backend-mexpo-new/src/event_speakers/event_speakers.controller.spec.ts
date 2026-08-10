import { Test, TestingModule } from '@nestjs/testing';
import { EventSpeakersController } from './event_speakers.controller';
import { EventSpeakersService } from './event_speakers.service';

describe('EventSpeakersController', () => {
  let controller: EventSpeakersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventSpeakersController],
      providers: [EventSpeakersService],
    }).compile();

    controller = module.get<EventSpeakersController>(EventSpeakersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
