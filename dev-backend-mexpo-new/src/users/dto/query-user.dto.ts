import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class QueryUserDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  // Query params arrive as strings ("true"/"false"); @Type(() => Boolean)
  // would coerce "false" into a truthy Boolean object. Parse explicitly.
  // ValidationPipe runs this twice and also for an absent key: keep
  // `undefined` as "no filter" instead of turning it into `false`.
  @Transform(({ value }: { value?: unknown }) =>
    value === undefined || value === ''
      ? undefined
      : value === 'true' || value === true,
  )
  is_active?: boolean;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_dir?: 'asc' | 'desc';
}
