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
import FormatValidation from '../helper/validation.format';
import * as authType from '../auth/auth.types';
import { RegistrationFieldsService } from './registration-fields.service';
import {
  CreateRegistrationFieldDto,
  UpdateRegistrationFieldDto,
} from './dto/registration-field.dto';
import { QueryRegistrationFieldDto } from './dto/query-registration-field.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Registration Fields')
@ApiBearerAuth()
@Controller('event-registration-fields')
@UseGuards(AuthGuard(`jwt`))
export class RegistrationFieldsController {
  constructor(
    private readonly registrationFieldsService: RegistrationFieldsService,
  ) {}

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`event_id`) event_id: string,
    @Body() dto: CreateRegistrationFieldDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.registrationFieldsService.create(
      event_id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryRegistrationFieldDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.registrationFieldsService.findAll(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(`:id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(
    @Param(`id`) id: string,
    @Body() dto: UpdateRegistrationFieldDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.registrationFieldsService.update(
      id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(`:id`)
  remove(@Param(`id`) id: string, @Request() request: authType.AuthRequest) {
    return this.registrationFieldsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
