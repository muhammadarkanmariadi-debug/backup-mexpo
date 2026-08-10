import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopBookingsController } from './workshop_bookings.controller';
import { WorkshopBookingsService } from './workshop_bookings.service';

describe('WorkshopBookingsController', () => {
  let controller: WorkshopBookingsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkshopBookingsController],
      providers: [WorkshopBookingsService],
    }).compile();

    controller = module.get<WorkshopBookingsController>(
      WorkshopBookingsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
