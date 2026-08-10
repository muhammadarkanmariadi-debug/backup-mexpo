import { Test, TestingModule } from '@nestjs/testing';
import { EventSpeakersService } from './event_speakers.service';

describe('EventSpeakersService', () => {
  let service: EventSpeakersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventSpeakersService],
    }).compile();

    service = module.get<EventSpeakersService>(EventSpeakersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
