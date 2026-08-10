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
  UploadedFile,
  UseInterceptors,
  Request,
  Query,
  Put,
} from '@nestjs/common';
import { EventSponsorsService } from './event-sponsors.service';
import { CreateEventSponsorDto } from './dto/create-event-sponsor.dto';
import { UpdateEventSponsorDto } from './dto/update-event-sponsor.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from 'src/helper/upload.format';
import * as authType from '../auth/auth.types';
import { QueryEventSponsorDto } from './dto/query-event-sponsor.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Event Sponsors')
@ApiBearerAuth()
@Controller('event-sponsors')
@UseGuards(AuthGuard(`jwt`))
export class EventSponsorsController {
  constructor(private readonly eventSponsorsService: EventSponsorsService) {}

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createEventSponsorDto: CreateEventSponsorDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventSponsorsService.create(
      event_id,
      createEventSponsorDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.eventSponsorsService.findOne(id);
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryEventSponsorDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventSponsorsService.findAll(
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
    @Body() updateEventSponsorDto: UpdateEventSponsorDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventSponsorsService.update(
      id,
      updateEventSponsorDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventSponsorsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
