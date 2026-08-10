import { Test, TestingModule } from '@nestjs/testing';
import { EventUsersController } from './event-users.controller';
import { EventUsersService } from './event-users.service';

describe('EventUsersController', () => {
  let controller: EventUsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventUsersController],
      providers: [EventUsersService],
    }).compile();

    controller = module.get<EventUsersController>(EventUsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
