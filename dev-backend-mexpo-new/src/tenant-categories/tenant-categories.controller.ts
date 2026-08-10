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
import { TenantCategoriesService } from './tenant-categories.service';
import { CreateTenantCategoryDto } from './dto/create-tenant-category.dto';
import { UpdateTenantCategoryDto } from './dto/update-tenant-category.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
import { RoleGuard, Roles } from 'src/helper/role-guard';
import * as authType from '../auth/auth.types';
import { QueryTenantCategoryDto } from './dto/query-tenant-category.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tenant Categories')
@ApiBearerAuth()
@Controller('tenant-categories')
@UseGuards(AuthGuard(`jwt`))
export class TenantCategoriesController {
  constructor(
    private readonly tenantCategoriesService: TenantCategoriesService,
  ) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(
    @Body() createTenantCategoryDto: CreateTenantCategoryDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantCategoriesService.create(
      createTenantCategoryDto,
      request.user.uuid,
    );
  }

  @Get()
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(@Query() query: QueryTenantCategoryDto) {
    return this.tenantCategoriesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantCategoriesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  update(
    @Param('id') id: string,
    @Body() updateTenantCategoryDto: UpdateTenantCategoryDto,
  ) {
    return this.tenantCategoriesService.update(id, updateTenantCategoryDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles(`SUPERADMIN`)
  remove(@Param('id') id: string) {
    return this.tenantCategoriesService.remove(id);
  }
}
