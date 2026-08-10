import { EventRole, USER_EVENT_STATUS } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateEventUserDto {
  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsEnum(EventRole)
  role?: EventRole;

  @IsOptional()
  @IsEnum(USER_EVENT_STATUS)
  status?: USER_EVENT_STATUS;
}
