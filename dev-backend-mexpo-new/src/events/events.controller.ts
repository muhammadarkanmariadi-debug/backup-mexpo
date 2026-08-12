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
  Put,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApproveEventDto } from './dto/approve-event.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../helper/upload.format';
import * as authType from '../auth/auth.types';
import { QueryEventDto } from './dto/query-event.dto';
import { RoleGuard, Roles } from '../helper/role-guard';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
@UseGuards(AuthGuard(`jwt`))
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  create(
    @Body() createEventDto: CreateEventDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.create(createEventDto, request.user.uuid, file);
  }

  @Get()
  @UseGuards(RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Get(`me`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findMyEvents(
    @Query() query: QueryEventDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.findAll(
      query,
      [`OWNER`, `COMMITTEE`, 'VISITOR', 'TENANT'],
      request.user.uuid,
    );
  }

  @Get(`visitor/me`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findMyEventsAsVisitor(
    @Query() query: QueryEventDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.findAll(query, [`VISITOR`], request.user.uuid);
  }

  @Get(`commitee/me`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findMyEventsAsCommitee(
    @Query() query: QueryEventDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.findAll(
      query,
      [`OWNER`, `COMMITTEE`],
      request.user.uuid,
    );
  }

  @Get(`tenant/me`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findMyEventsAsTenant(
    @Query() query: QueryEventDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.findAll(query, [`TENANT`], request.user.uuid);
  }

  @Get('approval-queue')
  @UseGuards(RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  approvalQueue(@Query() query: QueryEventDto) {
    return this.eventsService.findAllForApproval(query);
  }

  @Post(':id/publish-request')
  publishRequest(
    @Param('id') id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.publishRequest(id, request.user.uuid);
  }

  @Put(':id/approval')
  @UseGuards(RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  approval(
    @Param('id') id: string,
    @Body() approveEventDto: ApproveEventDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.approval(id, approveEventDto, request.user.uuid);
  }

  @Put(':id/finish')
  finish(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventsService.finish(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id/reopen')
  reopen(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventsService.reopen(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get('me/:id')
  findOneByuuid(
    @Param('id') id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventsService.findOne(id, request.user.uuid);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventsService.update(
      id,
      updateEventDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventsService.remove(id, request.user.uuid);
  }
}
