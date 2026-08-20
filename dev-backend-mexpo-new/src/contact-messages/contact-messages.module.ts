import { Module } from '@nestjs/common';
import { ContactMessagesService } from './contact-messages.service';
import { ContactMessagesController } from './contact-messages.controller';
import { MailService } from '../mail/mail.service';

@Module({
  controllers: [ContactMessagesController],
  providers: [ContactMessagesService, MailService],
})
export class ContactMessagesModule {}
