import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateEventContactDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;
}
