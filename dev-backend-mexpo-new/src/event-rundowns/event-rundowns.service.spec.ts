import { Test, TestingModule } from '@nestjs/testing';
import { EventRundownsService } from './event-rundowns.service';

describe('EventRundownsService', () => {
  let service: EventRundownsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventRundownsService],
    }).compile();

    service = module.get<EventRundownsService>(EventRundownsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
