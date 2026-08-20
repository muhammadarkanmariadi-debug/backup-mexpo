import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Certificate template payload (A10 — Konva designer).
 *
 * `template` is the Konva-serialized stage envelope produced by the designer:
 *   {
 *     version: 1,
 *     width: number,      // canvas px, e.g. 1200
 *     height: number,     // canvas px, e.g. 840
 *     background: { type: 'color'|'image'; value?: string; url?: string },
 *     nodes: [ ...Konva children... ]
 *   }
 * Each `Text` node may carry `attrs.binding`:
 *   { type: 'static', value: string }        // default value (designed text)
 *   { type: 'dynamic', key: CertificateFieldKey } // custom value (per recipient)
 * Sent as JSON (string or object) inside a multipart body alongside an
 * optional `file` (background image). Structural sanitization (binding keys,
 * node whitelist, dimensions) happens server-side in CertificatesService.
 */
export class CreateCertificateTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  /** Template family. WORKSHOP = workshop-participation certificates. */
  @IsOptional()
  @IsIn([`WORKSHOP`, `PARTICIPANT`])
  kind?: string;

  /** Konva stage envelope (see above). Parsed from JSON string if needed. */
  @IsOptional()
  @IsObject()
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as Record<string, unknown>)
      : value,
  )
  template?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value?: unknown }) => value === 'true')
  is_active?: boolean;
}

export class UpdateCertificateTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn([`WORKSHOP`, `PARTICIPANT`])
  kind?: string;

  @IsOptional()
  @IsObject()
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as Record<string, unknown>)
      : value,
  )
  template?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value?: unknown }) => value === 'true')
  is_active?: boolean;
}

/** Template canvas size preset (used to seed a new template from the UI). */
export class CertificateSizeDto {
  @IsInt()
  @Min(200)
  @Max(4000)
  @Type(() => Number)
  width: number;

  @IsInt()
  @Min(200)
  @Max(4000)
  @Type(() => Number)
  height: number;
}
