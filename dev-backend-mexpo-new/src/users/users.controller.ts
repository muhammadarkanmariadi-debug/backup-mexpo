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
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BasicGuard } from '../helper/basic-auth';
import FormatValidation from '../helper/validation.format';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageFileFilter } from '../helper/upload.format';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard, Roles } from '../helper/role-guard';
import * as authTypes from '../auth/auth.types';
import { QueryUserDto } from './dto/query-user.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ResetPasswordDto,
  VerifyResetPasswordDto,
} from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(BasicGuard)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor('file', imageFileFilter))
  create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.create(createUserDto, `USER`, file);
  }

  @Post(`superadmin`)
  @UseGuards(BasicGuard)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor('file', imageFileFilter))
  createSuperAdmin(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.create(createUserDto, `SUPERADMIN`, file);
  }

  @Post(`reset-password`)
  @UseGuards(BasicGuard)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  sendResetPassword(@Body() sendReset: ResetPasswordDto) {
    return this.usersService.sendEmailResetPassword(sendReset);
  }

  @Post(`reset-password/verify`)
  @UseGuards(BasicGuard)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  verifyResetPassword(@Body() resetPassword: VerifyResetPasswordDto) {
    return this.usersService.verifyResetPassword(resetPassword);
  }

  @Post(`resend-verification`)
  @UseGuards(BasicGuard)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  resendVerification(@Body() sendReset: ResetPasswordDto) {
    return this.usersService.resendVerificationEmail(sendReset.email);
  }

  @Get()
  @UseGuards(AuthGuard(`jwt`), RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query, `USER`);
  }

  @Get(`superadmin`)
  @UseGuards(AuthGuard(`jwt`), RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  findAllSuperadmin(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query, `SUPERADMIN`);
  }

  @Get('verification/:code')
  verifyEmail(@Param('code') code: string) {
    return this.usersService.verifyEmail(code);
  }

  @Get('me')
  @UseGuards(AuthGuard(`jwt`))
  findMe(@Request() req: authTypes.AuthRequest) {
    return this.usersService.findOne(req.user.uuid);
  }

  @Get(':id')
  @UseGuards(AuthGuard(`jwt`), RoleGuard)
  @Roles(`SUPERADMIN`)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('me')
  @UseGuards(AuthGuard(`jwt`))
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor('file', imageFileFilter))
  updateMe(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: authTypes.AuthRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const id: string = req.user.uuid;
    return this.usersService.update(id, updateUserDto, file);
  }

  @Put('me/password')
  @UseGuards(AuthGuard(`jwt`))
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: authTypes.AuthRequest,
  ) {
    return this.usersService.changePassword(req.user.uuid, changePasswordDto);
  }

  @Put('me/email')
  @UseGuards(AuthGuard(`jwt`))
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  changeEmail(
    @Body() changeEmailDto: ChangeEmailDto,
    @Request() req: authTypes.AuthRequest,
  ) {
    return this.usersService.changeEmail(req.user.uuid, changeEmailDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard(`jwt`), RoleGuard)
  @Roles(`SUPERADMIN`)
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  @UseInterceptors(FileInterceptor('file', imageFileFilter))
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserDto, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard(`jwt`), RoleGuard)
  @Roles(`SUPERADMIN`)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
