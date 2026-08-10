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
  Request,
  Query,
  Put,
} from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { CreateWorkshopDto } from './dto/create-workshop.dto';
import { UpdateWorkshopDto } from './dto/update-workshop.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryWorkshopDto } from './dto/query-workshop.dto';
import { AddSpeakerWorkshopDto } from './dto/add-speaker-workshop.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Workshops')
@ApiBearerAuth()
@Controller('workshops')
@UseGuards(AuthGuard(`jwt`))
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createWorkshopDto: CreateWorkshopDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopsService.create(
      event_id,
      createWorkshopDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Post(`speaker/:workshop_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  createSpeakerWorkshop(
    @Param(`workshop_id`) workshop_id: string,
    @Body() addWorkshopSpeakerDto: AddSpeakerWorkshopDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopsService.addSpeaker(
      workshop_id,
      addWorkshopSpeakerDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.workshopsService.findOne(id);
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryWorkshopDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopsService.findAll(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(
    @Param('id') id: string,
    @Body() updateWorkshopDto: UpdateWorkshopDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopsService.update(
      id,
      updateWorkshopDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete('speaker/:id')
  removeSpekaer(
    @Param('id') id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.workshopsService.removeSpeaker(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.workshopsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
