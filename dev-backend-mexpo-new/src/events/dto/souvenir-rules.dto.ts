import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

/**
 * Configurable souvenir eligibility rules (A5).
 * Stored per-event in `events.souvenir_rules` (JSON).
 *
 * - `minVisitedBooth` (default 5): minimum distinct booth visits.
 * - `minTransaction`: minimum total transaction amount (POS transactions must
 *   carry a scanned `visitor_id`).
 * - `joinedSeminar`: visitor must have a non-cancelled workshop booking.
 * - `requireAll` (default true): ALL configured rules must pass; `false` = ANY.
 */
export class SouvenirRulesDto {
  /** Minimum distinct booth visits required before a souvenir can be granted. Default: 5. */
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

  /** Minimum total transaction amount. Accepted but NOT evaluated (schema gap). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  minTransaction?: number;
}
