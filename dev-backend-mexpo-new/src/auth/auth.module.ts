import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { AuthController } from './auth.controller';
import { JWTStrategy } from '../helper/jwt.strategy';
import { BcryptService } from '../bcrypt/bcrypt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GoogleAuthService, JWTStrategy, BcryptService],
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: `jwt` }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>(`JWT_SECRET`);
        if (!secret) {
          throw new Error(
            `JWT_SECRET is not set. Set it in the environment before starting the server.`,
          );
        }
        return {
          secret,
          signOptions: { expiresIn: `1d` },
        };
      },
    }),
  ],
})
export class AuthModule {}
