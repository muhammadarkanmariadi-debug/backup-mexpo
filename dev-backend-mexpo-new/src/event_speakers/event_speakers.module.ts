import { Module } from '@nestjs/common';
import { EventSpeakersService } from './event_speakers.service';
import { EventSpeakersController } from './event_speakers.controller';

@Module({
  controllers: [EventSpeakersController],
  providers: [EventSpeakersService],
})
export class EventSpeakersModule {}
