import { departureMonth, RoleType } from '@prisma/client';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationAnswerDto } from 'src/registration-fields/dto/registration-field.dto';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(RoleType)
  role_type?: RoleType;

  @IsOptional()
  @IsString()
  destination_country?: string;

  @IsOptional()
  @IsString()
  @IsEnum(departureMonth)
  departure_month?: departureMonth;

  // ── A1: paid ticket ──
  @IsOptional()
  @IsString()
  ticket_type_id?: string;

  @IsOptional()
  @IsString()
  payment_reference?: string;

  @IsOptional()
  @IsString()
  payment_method?: string;

  // ── A8: dynamic registration form answers ──
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationAnswerDto)
  answers?: RegistrationAnswerDto[];
}
