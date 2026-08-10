import { Test, TestingModule } from '@nestjs/testing';
import { EventContactsController } from './event-contacts.controller';
import { EventContactsService } from './event-contacts.service';

describe('EventContactsController', () => {
  let controller: EventContactsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventContactsController],
      providers: [EventContactsService],
    }).compile();

    controller = module.get<EventContactsController>(EventContactsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
