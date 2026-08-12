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
} from '@nestjs/common';
import { AttendancesService } from './attendances.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

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
}
