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
} from '@nestjs/common';
import { SouvenirsService } from './souvenirs.service';
import { CreateSouvenirDto } from './dto/create-souvenir.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import * as authRequest from '../auth/auth.types';
import { QuerySouvenirDto } from './dto/query-souvenir.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Souvenirs')
@ApiBearerAuth()
@Controller('souvenirs')
@UseGuards(AuthGuard(`jwt`))
export class SouvenirsController {
  constructor(private readonly souvenirsService: SouvenirsService) {}

  @Post(`check/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  check(
    @Param(`event_id`) event_id: string,
    @Body() createSouvenirDto: CreateSouvenirDto,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.check(
      event_id,
      createSouvenirDto,
      request.user.uuid,
    );
  }

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createSouvenirDto: CreateSouvenirDto,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.create(
      event_id,
      createSouvenirDto,
      request.user.uuid,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.souvenirsService.findOne(+id);
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QuerySouvenirDto,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.findAll(event_id, query, request.user.uuid);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.souvenirsService.remove(+id);
  }
}
