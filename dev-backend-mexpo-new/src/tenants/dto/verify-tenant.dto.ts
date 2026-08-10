import { TenantStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class VerifyTenantDto {
  @IsNotEmpty()
  @IsEnum(TenantStatus)
  status: TenantStatus;
}
