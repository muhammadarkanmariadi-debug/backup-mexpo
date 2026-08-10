import { Type } from 'class-transformer';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateTenantProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number;
}
