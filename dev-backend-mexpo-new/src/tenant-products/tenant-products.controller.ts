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
  UploadedFile,
  UseInterceptors,
  Query,
  Put,
} from '@nestjs/common';
import { TenantProductsService } from './tenant-products.service';
import { CreateTenantProductDto } from './dto/create-tenant-product.dto';
import { UpdateTenantProductDto } from './dto/update-tenant-product.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
import * as authType from '../auth/auth.types';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from 'src/helper/upload.format';
import { QueryTenantProductDto } from './dto/query-tenant-product.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tenant Products')
@ApiBearerAuth()
@Controller('tenant-products')
@UseGuards(AuthGuard(`jwt`))
export class TenantProductsController {
  constructor(private readonly tenantProductsService: TenantProductsService) {}

  @Post(`:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  create(
    @Param(`tenant_id`) tenant_id: string,
    @Body() createTenantProductDto: CreateTenantProductDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantProductsService.create(
      tenant_id,
      createTenantProductDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.tenantProductsService.findOne(id);
  }

  @Get(`:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`tenant_id`) tenant_id: string,
    @Query() query: QueryTenantProductDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantProductsService.findAll(
      tenant_id,
      query,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  update(
    @Param('id') id: string,
    @Body() updateTenantProductDto: UpdateTenantProductDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.tenantProductsService.update(
      id,
      updateTenantProductDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.tenantProductsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
