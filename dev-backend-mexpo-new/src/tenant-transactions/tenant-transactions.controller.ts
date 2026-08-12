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
  UseInterceptors,
  Request,
  UploadedFile,
  Query,
  Put,
} from '@nestjs/common';
import { TenantTransactionsService } from './tenant-transactions.service';
import { CreateTenantTransactionDto } from './dto/create-tenant-transaction.dto';
import { UpdateTenantTransactionDto } from './dto/update-tenant-transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from '../helper/validation.format';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../helper/upload.format';
import * as authType from '../auth/auth.types';
import { QueryTenantTransactionDto } from './dto/query-tenant-transaction.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tenant Transactions (POS)')
@ApiBearerAuth()
@Controller('tenant-transactions')
@UseGuards(AuthGuard(`jwt`))
export class TenantTransactionsController {
  constructor(
    private readonly tenantTransactionsService: TenantTransactionsService,
  ) {}

  @Post(`:tenant_id`)
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  @UsePipes(
    new ValidationPipe({ exceptionFactory: FormatValidation, transform: true }),
  )
  create(
    @Param(`tenant_id`) tenant_id: string,
    @Body() createTenantTransactionDto: CreateTenantTransactionDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantTransactionsService.create(
      tenant_id,
      createTenantTransactionDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.tenantTransactionsService.findOne(id);
  }

  @Get(`:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`tenant_id`) tenant_id: string,
    @Query() query: QueryTenantTransactionDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantTransactionsService.findAll(
      tenant_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  @UsePipes(
    new ValidationPipe({ exceptionFactory: FormatValidation, transform: true }),
  )
  update(
    @Param('id') id: string,
    @Body() updateTenantTransactionDto: UpdateTenantTransactionDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantTransactionsService.update(
      id,
      updateTenantTransactionDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.tenantTransactionsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
