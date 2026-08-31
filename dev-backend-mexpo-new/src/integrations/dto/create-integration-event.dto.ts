import {
  EventType,
  EventVisibility,
  RegistrationFieldType,
  TicketMode,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class IntegrationCustomFieldDto {
  @IsOptional()
  @IsString()
  field_key?: string;

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsOptional()
  @IsEnum(RegistrationFieldType)
  type?: RegistrationFieldType = RegistrationFieldType.TEXT;

  @IsOptional()
  @IsBoolean()
  required?: boolean = false;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsInt()
  position?: number;
}

export class CreateIntegrationEventDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  location?: string = 'Online / School Campus';

  @IsNotEmpty()
  @IsDateString()
  start_date: string;

  @IsNotEmpty()
  @IsDateString()
  end_date: string;

  @IsOptional()
  @IsDateString()
  registration_start?: string;

  @IsOptional()
  @IsDateString()
  registration_deadline?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  quota?: number = 0;

  @IsOptional()
  @IsString()
  organizer_name?: string = 'School Administration';

  @IsOptional()
  @IsString()
  photo?: string;

  /** Default to PRIVATE so it remains unlisted on Mexpo public explore page */
  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility = EventVisibility.PRIVATE;

  @IsOptional()
  @IsEnum(EventType)
  event_type?: EventType = EventType.CAMPUS_SCHOOL;

  @IsOptional()
  @IsEnum(TicketMode)
  ticket_mode?: TicketMode = TicketMode.FREE;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  ticket_price?: number = 0;

  @IsOptional()
  @IsString()
  ticket_name?: string = 'Trial Class Pass';

  /** Webhook callback URL to receive registration notifications */
  @IsOptional()
  @IsString()
  callback_url?: string;

  /** Optional slug override */
  @IsOptional()
  @IsString()
  slug?: string;

  /** Dynamic registration questions for Trial Class */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IntegrationCustomFieldDto)
  custom_fields?: IntegrationCustomFieldDto[];

  @IsOptional()
  @IsObject()
  extra_features?: Record<string, unknown>;
}
