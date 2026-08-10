import { Module } from '@nestjs/common';
import { EventSponsorsService } from './event-sponsors.service';
import { EventSponsorsController } from './event-sponsors.controller';

@Module({
  controllers: [EventSponsorsController],
  providers: [EventSponsorsService],
})
export class EventSponsorsModule {}
