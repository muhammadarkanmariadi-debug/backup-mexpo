import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Param,
  Request,
  Query,
  Put,
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateAttendanceDto, UpdateWorkshopAttendanceDto } from './dto/update-attendance.dto';

@ApiTags('Attendances')
@ApiBearerAuth()
@Controller('attendances')
@UseGuards(AuthGuard(`jwt`))
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Post(`event/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.attendancesService.create(
      event_id,
      createAttendanceDto,
      request.user.uuid,
      request.user.role,
    );
  }

  @Post(`tenant/:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createTenantAttendance(
    @Param(`tenant_id`) tenant_id: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.attendancesService.createBoothAttendance(
      tenant_id,
      createAttendanceDto,
      request.user.uuid,
    );
  }

  @Post(`workshop/:workshop_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createWorkshopAttendance(
    @Param(`workshop_id`) workshop_id: string,
    @Body() createAttendanceDto: CreateAttendanceDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.attendancesService.createWorkshopAttendance(
      workshop_id,
      createAttendanceDto,
      request.user.uuid,
      request.user.role,
    );
  }

  @Get(`event/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllEventAttendances(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findAllEventAttendances(event_id, query);
  }

  @Get(`workshop/:workshop_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllWorkshopAttendances(
    @Param(`workshop_id`) workshop_id: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findAllWorkshopAttendances(
      workshop_id,
      query,
    );
  }

  @Get(`tenant/:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllTenantAttendances(
    @Param(`tenant_id`) tenant_id: string,
    @Query() query: QueryAttendanceDto,
  ) {
    return this.attendancesService.findAllTenantAttendances(tenant_id, query);
  }

  @Put(`event/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  checkout(
    @Param(`event_id`) event_id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
    @Request() request: authType.AuthRequest
  ) {
    return this.attendancesService.checkout(
      event_id,
      updateAttendanceDto,
      request.user.uuid,
      request.user.role,
    );
  }

  @Put(`workshop/:workshop_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  checkoutWorkshop(
    @Param(`workshop_id`) workshop_id: string,
    @Body() updateWorkshopAttendanceDto: UpdateWorkshopAttendanceDto,
    @Request() request: authType.AuthRequest
  ) {
    return this.attendancesService.checkoutWorkshop(
      workshop_id,
      updateWorkshopAttendanceDto,
      request.user.uuid,
      request.user.role,
    );
  }
}
