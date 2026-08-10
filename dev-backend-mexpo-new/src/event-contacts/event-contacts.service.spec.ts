import { Test, TestingModule } from '@nestjs/testing';
import { EventContactsService } from './event-contacts.service';

describe('EventContactsService', () => {
  let service: EventContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventContactsService],
    }).compile();

    service = module.get<EventContactsService>(EventContactsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
