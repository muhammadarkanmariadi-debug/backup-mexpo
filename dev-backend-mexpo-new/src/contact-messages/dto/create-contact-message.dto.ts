import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactMessageDto {
  @IsNotEmpty({ message: 'Nama wajib diisi' })
  @IsString()
  @MaxLength(120)
  name: string;

  @IsNotEmpty({ message: 'Email wajib diisi' })
  @IsString()
  @IsEmail({}, { message: 'Email tidak valid' })
  @MaxLength(120)
  email: string;

  @IsNotEmpty({ message: 'Subjek wajib diisi' })
  @IsString()
  @MaxLength(150)
  subject: string;

  @IsNotEmpty({ message: 'Pesan wajib diisi' })
  @IsString()
  @MinLength(10, { message: 'Pesan minimal 10 karakter' })
  @MaxLength(4000)
  message: string;
}
