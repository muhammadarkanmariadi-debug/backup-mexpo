import { Test, TestingModule } from '@nestjs/testing';
import { EventSponsorsService } from './event-sponsors.service';

describe('EventSponsorsService', () => {
  let service: EventSponsorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventSponsorsService],
    }).compile();

    service = module.get<EventSponsorsService>(EventSponsorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
