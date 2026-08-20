import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDTO } from './dto/auth.dto';
import { GoogleAuthService } from './google-auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import FormatValidation from '../helper/validation.format';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(@Body() authDto: AuthDTO) {
    return this.authService.auth(authDto);
  }

  /** Google Identity Services (GIS) — verify id_token, findOrCreate user, issue JWT. */
  @Post('google')
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  google(@Body() dto: GoogleAuthDto) {
    return this.googleAuthService.googleAuth(dto.credential);
  }
}
