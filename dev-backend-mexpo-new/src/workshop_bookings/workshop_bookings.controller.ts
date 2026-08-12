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
import { WorkshopBookingsService } from './workshop_bookings.service';
import { UpdateWorkshopBookingDto } from './dto/update-workshop_booking.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryWorkshopBookingDto } from './dto/query-workshop-booking.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Workshop Bookings')
@ApiBearerAuth()
@Controller('workshop-bookings')
@UseGuards(AuthGuard(`jwt`))
export class WorkshopBookingsController {
  constructor(
    private readonly workshopBookingsService: WorkshopBookingsService,
  ) {}

  @Post(`:workshop_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`workshop_id`) workshop_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopBookingsService.create(workshop_id, request.user.uuid);
  }

  @Get('certificates/my/:event_id')
  myCertificates(
    @Param('event_id') event_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopBookingsService.findMyCertificates(
      event_id,
      request.user.uuid,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.workshopBookingsService.findOne(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get(`:workshop_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`workshop_id`) workshop_id: string,
    @Query() query: QueryWorkshopBookingDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopBookingsService.findAll(
      workshop_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(
    @Param('id') id: string,
    @Body() updateWorkshopBookingDto: UpdateWorkshopBookingDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopBookingsService.update(
      id,
      updateWorkshopBookingDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.workshopBookingsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
