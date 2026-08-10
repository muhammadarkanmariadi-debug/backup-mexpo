import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Super-admin decision on a publish request (A3). */
export class ApproveEventDto {
  @IsNotEmpty()
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
