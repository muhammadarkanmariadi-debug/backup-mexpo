import { Module } from '@nestjs/common';
import { EventUsersService } from './event-users.service';
import { EventUsersController } from './event-users.controller';

@Module({
  controllers: [EventUsersController],
  providers: [EventUsersService],
})
export class EventUsersModule {}
