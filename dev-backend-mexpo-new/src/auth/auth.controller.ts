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
import FormatValidation from '../helper/validation.format';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @UsePipes(new ValidationPipe({ exceptionFactory: FormatValidation }))
  create(@Body() authDto: AuthDTO) {
    return this.authService.auth(authDto);
  }
}
