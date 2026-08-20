import {
  Body,
  Controller,
  Ip,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ContactMessagesService } from './contact-messages.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';
import FormatValidation from '../helper/validation.format';

/**
 * Public contact form (`POST /contact`). Deliberately has NO auth guard and is
 * NOT part of `public-api` (that controller is class-level Basic-auth). The
 * endpoint is meant to be callable by unauthenticated visitors. Spam is limited
 * by a lightweight in-memory per-IP window in the service.
 */
@ApiTags('Contact')
@Controller('contact')
export class ContactMessagesController {
  constructor(
    private readonly contactMessagesService: ContactMessagesService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Body() createContactMessageDto: CreateContactMessageDto,
    @Ip() ip: string,
  ) {
    return this.contactMessagesService.create(createContactMessageDto, ip);
  }
}
