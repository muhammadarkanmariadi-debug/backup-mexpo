import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, BcryptService, MailService],
})
export class UsersModule {}
