import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateWorkshopDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_time: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_time: Date;

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
