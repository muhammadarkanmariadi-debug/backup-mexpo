import { SponsorLevel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateEventSponsorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(SponsorLevel)
  level?: SponsorLevel;
}
