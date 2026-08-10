import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
