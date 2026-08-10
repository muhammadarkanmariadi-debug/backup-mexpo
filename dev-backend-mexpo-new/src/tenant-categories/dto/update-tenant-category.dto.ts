import { IsOptional, IsString } from 'class-validator';

export class UpdateTenantCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;
}
