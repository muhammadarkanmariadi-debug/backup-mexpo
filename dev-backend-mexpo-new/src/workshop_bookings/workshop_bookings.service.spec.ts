import { Test, TestingModule } from '@nestjs/testing';
import { WorkshopBookingsService } from './workshop_bookings.service';

describe('WorkshopBookingsService', () => {
  let service: WorkshopBookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkshopBookingsService],
    }).compile();

    service = module.get<WorkshopBookingsService>(WorkshopBookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
