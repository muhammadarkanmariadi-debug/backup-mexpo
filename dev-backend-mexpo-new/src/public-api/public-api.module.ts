import { Module } from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { PublicApiController } from './public-api.controller';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { MailService } from '../mail/mail.service';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [PublicApiController],
  providers: [PublicApiService, BcryptService, MailService],
})
export class PublicApiModule {}
