import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PublicApiService } from './public-api.service';
import { BasicGuard } from '../helper/basic-auth';
import FormatValidation from '../helper/validation.format';
import { QueryPublicEventDto } from './dto/query-public-api.dto';
import { QueryEventUserDto } from '../event-users/dto/query-event-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Public API')
@ApiBasicAuth()
@Controller('public-api')
@UseGuards(BasicGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Post(`registration/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  register(
    @Param(`event_id`) event_id: string,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.publicApiService.registerAsVisitor(event_id, createUserDto);
  }

  @Get(`events`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(@Query() query: QueryPublicEventDto) {
    return this.publicApiService.findAll(query);
  }

  @Get(`events/active`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllActive(@Query() query: QueryPublicEventDto) {
    return this.publicApiService.findAll(query, 'ACTIVE');
  }

  @Get(`events/upcoming`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllUpcoming(@Query() query: QueryPublicEventDto) {
    return this.publicApiService.findAll(query, 'UPCOMING');
  }

  @Get('events/:id')
  findOne(@Param('id') id: string) {
    return this.publicApiService.findOne(id);
  }

  @Get(`users/event/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllUserEvent(
    @Param('event_id') event_id: string,
    @Query() query: QueryEventUserDto,
  ) {
    return this.publicApiService.findAllUserEvent(event_id, query);
  }

  @Get(`registration-fields/:event_id`)
  findRegistrationFields(@Param(`event_id`) event_id: string) {
    return this.publicApiService.findRegistrationFields(event_id);
  }

  @Get(`ticket-types/:event_id`)
  findTicketTypes(@Param(`event_id`) event_id: string) {
    return this.publicApiService.findTicketTypes(event_id);
  }
}
