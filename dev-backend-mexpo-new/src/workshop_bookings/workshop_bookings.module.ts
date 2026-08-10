import { Module } from '@nestjs/common';
import { WorkshopBookingsService } from './workshop_bookings.service';
import { WorkshopBookingsController } from './workshop_bookings.controller';

@Module({
  controllers: [WorkshopBookingsController],
  providers: [WorkshopBookingsService],
})
export class WorkshopBookingsModule {}
