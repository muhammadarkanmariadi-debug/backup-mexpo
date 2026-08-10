import { Module } from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { PublicApiController } from './public-api.controller';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [PublicApiController],
  providers: [PublicApiService, BcryptService, MailService],
})
export class PublicApiModule {}
