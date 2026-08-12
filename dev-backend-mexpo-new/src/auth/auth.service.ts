import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthDTO } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bcrypt: BcryptService,
    private jwtService: JwtService,
  ) {}
  async auth(authDTO: AuthDTO) {
    try {
      const { email, password } = authDTO;
      const findUser = await this.prisma.users.findFirst({ where: { email } });
      if (!findUser) {
        throw new NotFoundException(`Email is not registered`);
      }
      if (!findUser.is_active) {
        throw new ConflictException(
          `Account is not active, please verify your email.`,
        );
      }
      const comparedPassword = await this.bcrypt.comparePassword(
        password,
        findUser.password,
      );
      if (!comparedPassword) {
        throw new BadRequestException(`Password is incorrect`);
      }
      const token = this.jwtService.sign({
        uuid: findUser.uuid,
        role: findUser.role,
      });
      return {
        success: true,
        message: `Authentication successful`,
        token,
        role: findUser.role,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error; // rethrow NestJS exceptions
      }
      throw new InternalServerErrorException(`Something were wrong. ${error}`);
    }
  }
}
