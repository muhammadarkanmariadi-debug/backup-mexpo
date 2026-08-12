import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
  Query,
} from '@nestjs/common';
import { EventRundownsService } from './event-rundowns.service';
import { CreateEventRundownDto } from './dto/create-event-rundown.dto';
import { UpdateEventRundownDto } from './dto/update-event-rundown.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryEventRundownDto } from './dto/query-event-rundown.dto';
import { AddSpeakerRundownDto } from './dto/add-speaker-rundown.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Event Rundowns')
@ApiBearerAuth()
@Controller('event-rundowns')
@UseGuards(AuthGuard(`jwt`))
export class EventRundownsController {
  constructor(private readonly eventRundownsService: EventRundownsService) {}

  @Post(`speaker/:id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  addSpeaker(
    @Param(`id`) rundown_id: string,
    @Body() addRundownSpeaker: AddSpeakerRundownDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventRundownsService.addSpeaker(
      addRundownSpeaker,
      rundown_id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createEventRundownDto: CreateEventRundownDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventRundownsService.create(
      event_id,
      createEventRundownDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventRundownsService.findOne(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryEventRundownDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventRundownsService.findAll(
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
    @Body() updateEventRundownDto: UpdateEventRundownDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventRundownsService.update(
      id,
      updateEventRundownDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete('speaker/:id')
  removeSpeaker(
    @Param('id') id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventRundownsService.dropRundownSpeaker(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventRundownsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
