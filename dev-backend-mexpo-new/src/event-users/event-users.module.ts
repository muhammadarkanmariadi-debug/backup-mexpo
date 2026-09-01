import { Module } from '@nestjs/common';
import { EventUsersService } from './event-users.service';
import { EventUsersController } from './event-users.controller';
import { MailService } from '../mail/mail.service';
import { BcryptService } from '../bcrypt/bcrypt.service';

@Module({
  controllers: [EventUsersController],
  providers: [EventUsersService, MailService, BcryptService],
})
export class EventUsersModule {}

