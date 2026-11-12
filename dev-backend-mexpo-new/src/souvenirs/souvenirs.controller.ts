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
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { imageFileFilter } from '../helper/upload.format';
import { SouvenirsService } from './souvenirs.service';
import { CreateSouvenirDto } from './dto/create-souvenir.dto';
import { RedeemSouvenirDto } from './dto/redeem-souvenir.dto';
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

  /** The caller's own points, history, catalog state and redemption. */
  @Get(`me/:event_id`)
  findMine(
    @Param(`event_id`) event_id: string,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.findMine(event_id, request.user.uuid);
  }

  /** A visitor redeems their own points for one catalog item. */
  @Post(`redeem/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  redeem(
    @Param(`event_id`) event_id: string,
    @Body() dto: RedeemSouvenirDto,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.redeem(event_id, dto, request.user.uuid);
  }

  /** Catalog item photo upload; returns `{ url }` to store in the item. */
  @Post(`catalog-image/:event_id`)
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  uploadCatalogImage(
    @Param(`event_id`) event_id: string,
    @Request() request: authRequest.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.souvenirsService.uploadCatalogImage(
      event_id,
      request.user.uuid,
      request.user.role as UserRole,
      file,
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
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.findOne(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
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
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: authRequest.AuthRequest,
  ) {
    return this.souvenirsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
