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
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
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
