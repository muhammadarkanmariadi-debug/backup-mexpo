import { TenantMemberRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateTenantMemberDto {
  @IsNotEmpty()
  @IsEnum(TenantMemberRole)
  role: TenantMemberRole;
}
