import { IsEnum, IsOptional } from 'class-validator';
import { EventRole, USER_EVENT_STATUS } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BroadcastTicketsDto {
  @ApiPropertyOptional({ enum: USER_EVENT_STATUS, default: USER_EVENT_STATUS.APPROVED })
  @IsOptional()
  @IsEnum(USER_EVENT_STATUS)
  status?: USER_EVENT_STATUS;

  @ApiPropertyOptional({ enum: EventRole, default: EventRole.VISITOR })
  @IsOptional()
  @IsEnum(EventRole)
  role?: EventRole;
}
