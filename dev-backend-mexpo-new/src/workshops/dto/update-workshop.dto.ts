import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateWorkshopDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_time?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_time?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  quota?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_public?: boolean;
}
