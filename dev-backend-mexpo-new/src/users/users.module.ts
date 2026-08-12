import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { MailService } from '../mail/mail.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, BcryptService, MailService],
})
export class UsersModule {}
