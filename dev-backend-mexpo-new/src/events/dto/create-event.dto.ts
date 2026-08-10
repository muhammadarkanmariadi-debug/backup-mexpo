import { EventType, EventVisibility, TicketMode } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { SouvenirRulesDto } from './souvenir-rules.dto';
import { EventFeaturesDto } from './event-features.dto';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registration_start?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  registration_deadline?: Date;

  @IsNotEmpty()
  @IsString()
  organizer_name: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  quota?: number;

  /** Configurable souvenir eligibility rules. Sent as JSON (string or object). */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SouvenirRulesDto)
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string' ? (JSON.parse(value) as SouvenirRulesDto) : value,
  )
  souvenir_rules?: SouvenirRulesDto;

  /** Event visibility (A2). Defaults to PUBLIC. */
  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;

  /** Event type / category (A7). Defaults to OTHER. */
  @IsOptional()
  @IsEnum(EventType)
  event_type?: EventType;

  /** Ticket mode (A1). Defaults to FREE. */
  @IsOptional()
  @IsEnum(TicketMode)
  ticket_mode?: TicketMode;

  /** Per-event feature toggles (A2). Sent as JSON (string or object). */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EventFeaturesDto)
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string' ? (JSON.parse(value) as EventFeaturesDto) : value,
  )
  features?: EventFeaturesDto;
}
