import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EventRole } from '@prisma/client';

export class BulkEventUserItemDto {
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsEnum(EventRole)
  role?: EventRole;
}

export class BulkImportEventUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkEventUserItemDto)
  users: BulkEventUserItemDto[];
}
