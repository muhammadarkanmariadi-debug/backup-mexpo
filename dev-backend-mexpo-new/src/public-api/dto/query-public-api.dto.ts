import { EventType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryPublicEventDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  quantity?: number;

  @IsOptional()
  @IsString()
  search?: string;

  /** Filter by event type (A7). */
  @IsOptional()
  @IsEnum(EventType)
  event_type?: EventType;

  /** Filter by ticket mode: FREE | PAID */
  @IsOptional()
  @IsString()
  ticket_mode?: string;

  /** Filter by time category: ALL | ON_GOING | UPCOMING | PAST */
  @IsOptional()
  @IsString()
  category?: string;

  /** Sort option: date-asc | date-desc | name-asc | name-desc | created-desc */
  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  sort_dir?: 'asc' | 'desc';
}
