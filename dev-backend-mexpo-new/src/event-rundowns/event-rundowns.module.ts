import { Module } from '@nestjs/common';
import { EventRundownsService } from './event-rundowns.service';
import { EventRundownsController } from './event-rundowns.controller';

@Module({
  controllers: [EventRundownsController],
  providers: [EventRundownsService],
})
export class EventRundownsModule {}
