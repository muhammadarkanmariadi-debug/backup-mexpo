import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  Request,
  UploadedFile,
  Query,
  Put,
} from '@nestjs/common';
import { EventSpeakersService } from './event_speakers.service';
import { CreateEventSpeakerDto } from './dto/create-event_speaker.dto';
import { UpdateEventSpeakerDto } from './dto/update-event_speaker.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../helper/upload.format';
import * as authType from '../auth/auth.types';
import { QueryEventSpeakerDto } from './dto/query-event-speaker.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Event Speakers')
@ApiBearerAuth()
@Controller('event-speakers')
@UseGuards(AuthGuard(`jwt`))
export class EventSpeakersController {
  constructor(private readonly eventSpeakersService: EventSpeakersService) {}

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createEventSpeakerDto: CreateEventSpeakerDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventSpeakersService.create(
      event_id,
      createEventSpeakerDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Get('profile/:id')
  findOne(@Param('id') id: string) {
    return this.eventSpeakersService.findOne(id);
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryEventSpeakerDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventSpeakersService.findAll(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  update(
    @Param('id') id: string,
    @Body() updateEventSpeakerDto: UpdateEventSpeakerDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventSpeakersService.update(
      id,
      updateEventSpeakerDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventSpeakersService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
