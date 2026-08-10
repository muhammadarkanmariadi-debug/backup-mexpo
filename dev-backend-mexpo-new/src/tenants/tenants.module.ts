import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { BcryptService } from 'src/bcrypt/bcrypt.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, BcryptService, MailService],
})
export class TenantsModule {}
