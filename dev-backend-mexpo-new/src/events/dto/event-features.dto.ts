import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  Matches,
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

  /** Custom Google Maps embed URL (or raw iframe src) provided by the organizer */
  @IsOptional()
  @IsString()
  maps_embed_url?: string;

  /**
   * Display ratio of the event photo on the public detail page, as
   * "<width>:<height>" (up to two decimals each), e.g. "16:9" or "1.33:1".
   * The frontend clamps it to a sane range; absent means 16:9.
   */
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,2}(\.\d{1,2})?:\d{1,2}(\.\d{1,2})?$/, {
    message: 'photo_ratio must look like "16:9" or "1.33:1"',
  })
  photo_ratio?: string;

  /** `contain` shows the whole photo over a blurred fill, `cover` crops it to the frame. */
  @IsOptional()
  @IsIn(['contain', 'cover'])
  photo_fit?: 'contain' | 'cover';
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
