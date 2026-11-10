import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Point rule for booth visits (point system). */
export class BoothVisitPointDto {
  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  pointsPerVisit: number;
}

/** Point rule for joined seminars/workshops (point system). */
export class SeminarPointDto {
  @IsBoolean()
  enabled: boolean;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  pointsPerSeminar: number;
}

/** Point rule for POS transactions (point system). */
export class TransactionPointDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pointsPerTransaction?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amountStep?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pointsPerAmountStep?: number;
}

/**
 * A souvenir catalog item defined by the organizer. Redeeming it costs
 * `minPoints` from the visitor's balance.
 */
export class SouvenirTierDto {
  @IsString()
  id: string;

  @IsString()
  @MaxLength(120)
  name: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  minPoints: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Photo URL (uploaded via POST /souvenirs/catalog-image/:event_id). */
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  image?: string;

  /** Units available; absent/null = unlimited. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock?: number | null;
}

/**
 * Configurable souvenir eligibility rules (A5).
 * Stored per-event in `events.souvenir_rules` (JSON).
 *
 * Standard mode (`usePointSystem` false/absent):
 * - `minVisitedBooth`: minimum distinct booth visits.
 * - `minTransaction`: minimum total transaction amount (POS transactions must
 *   carry a scanned `visitor_id`).
 * - `joinedSeminar`: visitor must have a non-cancelled workshop booking.
 * - `requireAll` (default true): ALL configured rules must pass; `false` = ANY.
 *
 * Point mode (`usePointSystem` true): points per activity (each with an
 * `enabled` toggle) and organizer-defined souvenir `tiers`.
 */
export class SouvenirRulesDto {
  /** Minimum distinct booth visits required before a souvenir can be granted. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minVisitedBooth?: number;

  /** Requires the visitor to have joined (booked) a seminar/workshop. */
  @IsOptional()
  @IsBoolean()
  joinedSeminar?: boolean;

  /** `true` = ALL rules must pass (default); `false` = ANY rule suffices. */
  @IsOptional()
  @IsBoolean()
  requireAll?: boolean;

  /** Minimum total transaction amount. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minTransaction?: number;

  /** Enables the point & tier system for this event. */
  @IsOptional()
  @IsBoolean()
  usePointSystem?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => BoothVisitPointDto)
  boothVisitPoint?: BoothVisitPointDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeminarPointDto)
  seminarPoint?: SeminarPointDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransactionPointDto)
  transactionPoint?: TransactionPointDto;

  /** Souvenir types set by the organizer, unlocked by points. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SouvenirTierDto)
  tiers?: SouvenirTierDto[];
}
