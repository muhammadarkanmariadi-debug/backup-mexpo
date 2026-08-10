import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTenantTransactionDto {
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as DetailTransactionDto[])
      : value,
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailTransactionDto)
  detail_transactions: DetailTransactionDto[];

  /** A14 — payment method (CASH / QRIS / TRANSFER, free-form). */
  @IsOptional()
  @IsString()
  payment_method?: string;

  /** A14 — whether the transaction has been paid. */
  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  /** A5 — visitor this transaction belongs to (scanned QR at POS). */
  @IsOptional()
  @IsString()
  visitor_id?: string;
}

export class DetailTransactionDto {
  @IsNotEmpty()
  @IsString()
  product_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  quantity: number;
}
