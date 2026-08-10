import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DetailTransactionDto } from './create-tenant-transaction.dto';
import { Transform, Type } from 'class-transformer';

export class UpdateTenantTransactionDto {
  @IsOptional()
  @Transform(({ value }: { value?: unknown }) =>
    typeof value === 'string'
      ? (JSON.parse(value) as DetailTransactionDto[])
      : value,
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailTransactionDto)
  detail_transactions?: DetailTransactionDto[];

  @IsOptional()
  @IsString()
  payment_method?: string;

  @IsOptional()
  @IsBoolean()
  paid?: boolean;

  @IsOptional()
  @IsString()
  visitor_id?: string;
}
