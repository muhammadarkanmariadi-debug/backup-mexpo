import { Module } from '@nestjs/common';
import { EventContactsService } from './event-contacts.service';
import { EventContactsController } from './event-contacts.controller';

@Module({
  controllers: [EventContactsController],
  providers: [EventContactsService],
})
export class EventContactsModule {}
