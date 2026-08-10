import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import FormatValidation from 'src/helper/validation.format';
import * as authType from '../auth/auth.types';
import { TicketsService } from './tickets.service';
import {
  CreateTicketTypeDto,
  UpdateTicketTypeDto,
} from './dto/ticket-type.dto';
import { BuyTicketDto, UpdateTicketDto } from './dto/ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller()
@UseGuards(AuthGuard(`jwt`))
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ── Ticket types (owner) ──

  @Post(`ticket-types/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createTicketType(
    @Param(`event_id`) event_id: string,
    @Body() dto: CreateTicketTypeDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.createTicketType(
      event_id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get(`ticket-types/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllTicketTypes(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryTicketDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.findAllTicketTypes(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(`ticket-types/:id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  updateTicketType(
    @Param(`id`) id: string,
    @Body() dto: UpdateTicketTypeDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.updateTicketType(
      id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(`ticket-types/:id`)
  removeTicketType(
    @Param(`id`) id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.removeTicketType(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  // ── Tickets ──

  @Post(`tickets/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  buy(
    @Param(`event_id`) event_id: string,
    @Body() dto: BuyTicketDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.buy(event_id, dto, request.user.uuid);
  }

  @Get(`tickets/my/:event_id`)
  findMy(
    @Param(`event_id`) event_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.findMy(event_id, request.user.uuid);
  }

  @Get(`tickets/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryTicketDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.findAll(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(`tickets/:id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  updateTicket(
    @Param(`id`) id: string,
    @Body() dto: UpdateTicketDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.ticketsService.updateTicket(
      id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
