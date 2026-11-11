import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTenantCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
