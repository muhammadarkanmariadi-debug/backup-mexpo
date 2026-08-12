import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  UsePipes,
  Request,
  Query,
  Put,
} from '@nestjs/common';
import { EventContactsService } from './event-contacts.service';
import { CreateEventContactDto } from './dto/create-event-contact.dto';
import { UpdateEventContactDto } from './dto/update-event-contact.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryEventContactDto } from './dto/query-event-contact.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Event Contacts')
@ApiBearerAuth()
@Controller('event-contacts')
@UseGuards(AuthGuard(`jwt`))
export class EventContactsController {
  constructor(private readonly eventContactsService: EventContactsService) {}

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createEventContactDto: CreateEventContactDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventContactsService.create(
      event_id,
      createEventContactDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.eventContactsService.findOne(id);
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryEventContactDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventContactsService.findAll(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(
    @Param('id') id: string,
    @Body() updateEventContactDto: UpdateEventContactDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventContactsService.update(
      id,
      updateEventContactDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventContactsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
