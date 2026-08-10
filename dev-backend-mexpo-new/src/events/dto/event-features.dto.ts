import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';

/**
 * Per-event feature toggles (A2 — docx "Core System Concept").
 * All keys are optional; `false`/`true` explicitly enables or disables a
 * feature. When a key is absent the feature defaults to enabled.
 */
export class EventFeaturesDto {
  @IsOptional()
  @IsBoolean()
  tenant?: boolean;

  @IsOptional()
  @IsBoolean()
  seminar?: boolean;

  @IsOptional()
  @IsBoolean()
  souvenir?: boolean;

  @IsOptional()
  @IsBoolean()
  product?: boolean;

  @IsOptional()
  @IsBoolean()
  pos?: boolean;

  @IsOptional()
  @IsBoolean()
  paidTicket?: boolean;
}

/** Object wrapper used inside Create/UpdateEventDto (JSON string or object). */
export class EventConfigDto {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => EventFeaturesDto)
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string' ? (JSON.parse(value) as EventFeaturesDto) : value,
  )
  features?: EventFeaturesDto;
}
