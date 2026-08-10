import { RegistrationFieldType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRegistrationFieldDto {
  @IsNotEmpty()
  @IsString()
  field_key: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsEnum(RegistrationFieldType)
  type: RegistrationFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /** Options for SELECT fields. Sent as JSON (string or array). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string' ? (JSON.parse(value) as string[]) : value,
  )
  options?: string[];

  /** A8 — show this field only when another field equals a value: { field_key, value }. */
  @IsOptional()
  @IsObject()
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as { field_key: string; value: string })
      : value,
  )
  condition?: { field_key: string; value: string };

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  position?: number;
}

export class UpdateRegistrationFieldDto {
  @IsOptional()
  @IsString()
  field_key?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsEnum(RegistrationFieldType)
  type?: RegistrationFieldType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string' ? (JSON.parse(value) as string[]) : value,
  )
  options?: string[];

  /** A8 — show this field only when another field equals a value. */
  @IsOptional()
  @IsObject()
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as { field_key: string; value: string })
      : value,
  )
  condition?: { field_key: string; value: string };

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  position?: number;
}

/** Answer payload used by public registration: { field_key, value }. */
export class RegistrationAnswerDto {
  @IsNotEmpty()
  @IsString()
  field_key: string;

  @IsOptional()
  @IsString()
  value?: string;
}

export class RegistrationAnswersDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationAnswerDto)
  @IsObject({ each: true })
  answers?: RegistrationAnswerDto[];
}
