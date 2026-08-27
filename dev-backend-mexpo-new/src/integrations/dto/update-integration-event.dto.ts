import { EventStatus, EventType, EventVisibility, TicketMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { IntegrationCustomFieldDto } from './create-integration-event.dto';

export class UpdateIntegrationEventDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsDateString()
  registration_start?: string;

  @IsOptional()
  @IsDateString()
  registration_deadline?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  quota?: number;

  @IsOptional()
  @IsString()
  organizer_name?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventType)
  event_type?: EventType;

  @IsOptional()
  @IsEnum(TicketMode)
  ticket_mode?: TicketMode;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ticket_price?: number;

  @IsOptional()
  @IsString()
  ticket_name?: string;

  @IsOptional()
  @IsString()
  callback_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegrationCustomFieldDto)
  custom_fields?: IntegrationCustomFieldDto[];

  @IsOptional()
  @IsObject()
  extra_features?: Record<string, unknown>;
}
