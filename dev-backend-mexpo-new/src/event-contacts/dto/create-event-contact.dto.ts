import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateEventContactDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone_number: string;
}
