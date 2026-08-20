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
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import FormatValidation from '../helper/validation.format';
import { imageFileFilter } from '../helper/upload.format';
import * as authType from '../auth/auth.types';
import { CertificatesService } from './certificates.service';
import {
  CreateCertificateTemplateDto,
  UpdateCertificateTemplateDto,
} from './dto/certificate-template.dto';
import { QueryCertificateTemplateDto } from './dto/query-certificate-template.dto';

@ApiTags('Certificates')
@ApiBearerAuth()
@Controller('certificates/templates')
@UseGuards(AuthGuard(`jwt`))
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  /** The active template used to render certificates for an event. */
  @Get(`active/:event_id`)
  findActive(
    @Param(`event_id`) event_id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.certificatesService.findActive(
      event_id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  create(
    @Param(`event_id`) event_id: string,
    @Body() dto: CreateCertificateTemplateDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() request: authType.AuthRequest,
  ) {
    return this.certificatesService.create(
      event_id,
      dto,
      file,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryCertificateTemplateDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.certificatesService.findAll(
      event_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(`:id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  update(
    @Param(`id`) id: string,
    @Body() dto: UpdateCertificateTemplateDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Request() request: authType.AuthRequest,
  ) {
    return this.certificatesService.update(
      id,
      dto,
      file,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(`:id`)
  remove(@Param(`id`) id: string, @Request() request: authType.AuthRequest) {
    return this.certificatesService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
