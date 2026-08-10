import { Test, TestingModule } from '@nestjs/testing';
import { EventUsersService } from './event-users.service';

describe('EventUsersService', () => {
  let service: EventUsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventUsersService],
    }).compile();

    service = module.get<EventUsersService>(EventUsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
