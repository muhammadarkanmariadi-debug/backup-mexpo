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
import { EventUsersService } from './event-users.service';
import { CreateEventUserDto } from './dto/create-event-user.dto';
import { UpdateEventUserDto } from './dto/update-event-user.dto';
import { BulkImportEventUsersDto } from './dto/bulk-import-event-user.dto';
import { BroadcastTicketsDto } from './dto/broadcast-tickets.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryEventUserDto } from './dto/query-event-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Event Users')
@ApiBearerAuth()
@Controller('event-users')
@UseGuards(AuthGuard(`jwt`))
export class EventUsersController {
  constructor(private readonly eventUsersService: EventUsersService) {}

  @Post(`visitor/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createVisitor(
    @Param(`event_id`) event_id: string,
    @Request() request: authType.AuthRequest,
    @Body() createEventUserDto?: CreateEventUserDto,
  ) {
    return this.eventUsersService.create(
      event_id,
      request.user.uuid,
      createEventUserDto,
      `VISITOR`,
    );
  }

  @Post(`committee/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createCommitee(
    @Param(`event_id`) event_id: string,
    @Body() createEventUserDto: CreateEventUserDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.create(
      event_id,
      request.user.uuid,
      createEventUserDto,
      `COMMITTEE`,
    );
  }

  @Post(`tenant/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createTenant(
    @Param(`event_id`) event_id: string,
    @Body() createEventUserDto: CreateEventUserDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.create(
      event_id,
      request.user.uuid,
      createEventUserDto,
      `TENANT`,
    );
  }

  @Post(`bulk-import/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  bulkImport(
    @Param(`event_id`) event_id: string,
    @Body() bulkImportDto: BulkImportEventUsersDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.bulkImportEventUsers(
      event_id,
      request.user.uuid,
      bulkImportDto,
    );
  }

  @Post(':event_id/resend-ticket/:user_id')
  resendTicket(
    @Param('event_id') event_id: string,
    @Param('user_id') user_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.resendTicket(
      event_id,
      user_id,
      request.user.uuid,
    );
  }

  @Post(':event_id/broadcast-tickets')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  broadcastTickets(
    @Param('event_id') event_id: string,
    @Body() dto: BroadcastTicketsDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.broadcastTickets(
      event_id,
      request.user.uuid,
      dto,
    );
  }

  @Get(':event_id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param('event_id') event_id: string,
    @Query() query: QueryEventUserDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.findAll(event_id, query, request.user.uuid);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(
    @Param('id') id: string,
    @Body() updateEventUserDto: UpdateEventUserDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.eventUsersService.update(
      id,
      updateEventUserDto,
      request.user.uuid,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.eventUsersService.remove(id, request.user.uuid);
  }
}

