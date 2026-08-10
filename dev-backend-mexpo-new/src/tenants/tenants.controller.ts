import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthGuard } from '@nestjs/passport';
import FormatValidation from 'src/helper/validation.format';
import * as authType from '../auth/auth.types';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from 'src/helper/upload.format';
import { InviteTenantDto } from './dto/invite-tenant.dto';
import { VerifyTenantDto } from './dto/verify-tenant.dto';
import { UpdateTenantMemberDto } from './dto/update-tenant-member.dto';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(AuthGuard(`jwt`))
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post(`invite/:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  invite(
    @Param(`tenant_id`) tenant_id: string,
    @Body() inviteDto: InviteTenantDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.inviteTenantMember(
      tenant_id,
      inviteDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Post(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  create(
    @Param(`event_id`) event_id: string,
    @Body() createTenantDto: CreateTenantDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tenantsService.create(
      event_id,
      createTenantDto,
      request.user.uuid,
      file,
      request.user.role as UserRole,
    );
  }

  @Get(`mine/:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllMyTenant(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryTenantDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.findAllMyTenant(
      event_id,
      query,
      request.user.uuid,
    );
  }

  @Get(`members/:tenant_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllMember(
    @Param(`tenant_id`) tenant_id: string,
    @Query() query: QueryTenantDto,
  ) {
    return this.tenantsService.findAllMember(tenant_id, query);
  }

  @Get('detail/:id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get(`:event_id`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(
    @Param(`event_id`) event_id: string,
    @Query() query: QueryTenantDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.findAll(event_id, query, request.user.uuid);
  }

  @Put('verify/member/:id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  verifyTenantMember(
    @Param('id') id: string,
    @Body() verifyTenantDto: VerifyTenantDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.verifyMemberTenant(
      id,
      verifyTenantDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put('verify/:id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  verifyTenant(
    @Param('id') id: string,
    @Body() verifyTenantDto: VerifyTenantDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.verifyTenant(
      id,
      verifyTenantDto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put('member/:id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  changeMemberRole(
    @Param('id') id: string,
    @Body() dto: UpdateTenantMemberDto,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.changeMemberRole(
      id,
      dto,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor(`file`, imageFileFilter))
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @Request() request: authType.AuthRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.tenantsService.update(
      id,
      updateTenantDto,
      request.user.uuid,
      file,
    );
  }

  @Delete('member/:id')
  removeMember(
    @Param('id') id: string,
    @Request() request: authType.AuthRequest,
  ) {
    return this.tenantsService.removeMember(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() request: authType.AuthRequest) {
    return this.tenantsService.remove(
      id,
      request.user.uuid,
      request.user.role as UserRole,
    );
  }
}
